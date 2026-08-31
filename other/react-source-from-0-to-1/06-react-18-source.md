# 6. React 18 源码：Lane、Scheduler、`createRoot`

**18.0 稳定：2022-03。** Fiber 从 16 就在，但 **可中断的并发渲染作为默认能力**，是 18 通过新入口打开的。本仓库已经是 19，主路径仍是这一章的循环 + Lane。

用法（`createRoot`、`startTransition`）见 [reactjs-from-0-to-1/06](../reactjs-from-0-to-1/06-react-18-concurrent.md)。这里只讲源码怎么接。

## 6.1 入口换了，调度才换得了

```js
// packages/react-dom 对外
createRoot(container).render(<App />)
```

内部会创建 `FiberRoot`，`tag` 为 ConcurrentRoot，再 `updateContainer`。旧 `ReactDOM.render` 走的是 LegacyRoot：**即使底层是 Fiber，工作循环仍同步跑完**，没有时间片、不能被 transition 抢占。

**19 删除了 `ReactDOM.render`。** 所以现在读源码不必再管 legacy 入口，除非维护 17 应用。

SSR 对称 API 是 `hydrateRoot`；流式 SSR 是 `renderToPipeableStream`（Node）/ `renderToReadableStream`（Web Streams）。

## 6.2 Scheduler：时间片和 `MessageChannel`

独立包 `packages/scheduler`。React 把「这个 root 有活」登记进去，到期回调 `performConcurrentWorkOnRoot`。对齐 [卡颂 · Scheduler](https://react.iamkasong.com/concurrent/scheduler.html)：它干两件事——**时间切片**和**优先级调度**。和 React 自己的 Lane **不是同一套数字**。

浏览器一帧里 JS 能插的位置大致是：

```
宏任务 → 清完微任务 → rAF → 重排/重绘 → requestIdleCallback
```

`requestIdleCallback` 在绘制之后、有空才跑。官方不用它：兼容性；后台 tab 频率会掉到几乎不可用。`rAF` 只能卡在绘制 **之前**。于是 Scheduler 用更早的宏任务：**`MessageChannel.postMessage`**（没有就退回 `setTimeout`）。嵌套 `setTimeout(0)` 还有 4ms 下限，MessageChannel 没有。

- 默认时间片 **`frameYieldMs` ≈ 5ms**。一帧 16.6ms 里留给布局/绘制。跑久了会按 fps 微调。
- 任务过期时间按 Scheduler 优先级算，不是按 Lane：

| Scheduler 优先级 | 过期（卡颂书中数量级） |
| --- | --- |
| Immediate | `-1`（已经过期，立刻跑） |
| UserBlocking | ~250ms |
| Normal | ~5000ms |
| Low | ~10000ms |
| Idle | 几乎永不过期 |

`commitRoot` 包在 `runWithPriority(Immediate, …)` 里，所以 commit 是同步、最高调度档。

内部两个小顶堆：`timerQueue`（还没到 startTime）和 `taskQueue`（已就绪）。每次取最早过期的那个。并发 render 的回调 `performConcurrentWorkOnRoot` 若没干完会 **返回自己** 当 continuation，Scheduler 看到返回值是函数就把同一条任务接着排，这就是切片后续跑。

并发循环概念上就是 Didact 的 `workLoop`：

```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}
```

过期或必须同步的 Lane 走 `workLoopSync`，中间不 `shouldYield`。

## 6.3 Lane：31 位优先级掩码

文件：`packages/react-reconciler/src/ReactFiberLane.js`。[卡颂 · lane 模型](https://react.iamkasong.com/concurrent/lane.html) 用赛车道比喻：31 位就是 31 条赛道，**位数越小越内圈、优先级越高**；相邻若干位组成一条「批」（`Lanes`，区别于单条 `Lane`）。

16 的 `expirationTime` 是一个数字，很难表达「树上同时挂着点击更新和 transition」。Lane 用 **位**：可以并存、按位或合并、按最高有效位先做。

卡颂归纳的三个需求：能表示不同优先级；能表示「同一档里有多批」；计算是位运算所以便宜。

```js
includesSomeLane(a, b)  // (a & b) !== 0
isSubsetOfLanes(set, x) // (set & x) === x
mergeLanes(a, b)        // a | b
removeLanes(set, x)     // set & ~x
```

低优先级占用的位更多（Transition 一大段，Sync 只有 1 bit）：低优更容易被打断积压，需要更多槽。书中的 `SyncBatchedLane`、`InputDiscreteLanes` 等名字在 18/19 有过整理，读源码以当前 `ReactFiberLane.js` 为准，心智不变。

常见档位（名字以 18/19 源码为准，具体常量可能增减）：

| Lane | 典型来源 |
| --- | --- |
| `SyncLane` | 离散输入：click、keydown、change |
| `InputContinuousLane` | 连续输入：drag、mousemove |
| `DefaultLane` | 普通 `setState`（不在 transition 里） |
| `TransitionLane` × 多条 | `startTransition` / `useDeferredValue` |
| `RetryLane` | Suspense 数据回来后的重试 |
| `IdleLane` / Offscreen 相关 | 隐藏子树、空闲时预渲染 |

一次 `setState` 大致：

1. `requestUpdateLane(fiber)` 看当前执行上下文（是不是在事件里、是不是 `startTransition`）
2. 更新对象挂到 fiber 的 `updateQueue`，并把该 Lane 并入 fiber / 根的 `pendingLanes`
3. `ensureRootIsScheduled(root)`（`ReactFiberRootScheduler.js`）把 root 交给 Scheduler 或排到微任务里刷同步活
4. 真正开始时 `getNextLanes` 选出 **这一趟要渲染的子集**
5. 更高优先级到来：丢掉当前 WIP，先做高优先级，再重做低优先级（**抢占是丢弃，不是合并半成品**）

饿死保护：低优先级 Lane 等太久会被抬到同步，避免一直被点击打断而永远 commit 不了。

18 的 **自动批处理** 也来自这里：同一事件（以及 18 起的 timeout / Promise）里多次 `setState` 进同一 Lane，只调度一次 render。

## 6.4 一次更新在源码里的路径

```
用户 setState / 事件
  → dispatchSetState / enqueueUpdate          ReactFiberHooks.js / ReactFiberClassUpdateQueue.js
  → ensureRootIsScheduled                     ReactFiberRootScheduler.js
  → Scheduler 回调
  → performConcurrentWorkOnRoot               ReactFiberWorkLoop.js
      renderRootConcurrent / renderRootSync
        workLoop*
          performUnitOfWork
            beginWork → 用户组件 / reconcile
            completeWork → 创建 DOM、冒泡 flags
      finishConcurrentRender
        commitRoot
          commitBeforeMutationEffects
          commitMutationEffects      改 DOM
          commitLayoutEffects        useLayoutEffect、ref
          commitPassiveMountEffects    useEffect（paint 之后）
```

和 Didact 的差别：commit **拆成多段**，保证「先改 DOM，再同步 layout，paint 后再被动 effect」。这就是 `useLayoutEffect` 能读到布局、`useEffect` 不挡首次绘制的根源。

卡颂把前三段叫 before mutation / mutation / layout（[before mutation](https://react.iamkasong.com/renderer/beforeMutation.html)）。18 起还有 paint 后的 **passive**。遍历的是有 flags 的节点（早期是 `effectList`）：

| 子阶段 | 典型工作 | 为何在这一段 |
| --- | --- | --- |
| **before mutation** | `getSnapshotBeforeUpdate`；给 `useEffect` **调度**（还没执行）；focus/blur | DOM 还没改，快照是旧 UI；`componentWillXXX` 在 Fiber 下可能随 render 重跑，所以标 `UNSAFE_`，快照改到这段（同步、只一次） |
| **mutation** | 按 Placement / Update / Deletion 改 DOM；卸旧 ref | 真正碰宿主 |
| **layout** | `useLayoutEffect`、`componentDidMount/Update`、赋新 ref | DOM 已是新的，但还没 paint，适合读布局 |
| **passive** | `useEffect` 的 create / destroy | `flushPassiveEffects`，Normal 优先级，不挡首屏绘制 |

`useEffect` 分三步（卡颂）：before mutation 里 `scheduleCallback(flushPassiveEffects)` → layout 之后把 root 记到 `rootWithPendingPassiveEffects` → 回调里才真正遍历执行。不要在 `useEffect` 里做必须赶在 paint 前的事，那是 `useLayoutEffect` 的槽。

`useInsertionEffect`（**≥18**）比 layout 还早，给 CSS-in-JS 插样式，卡颂书里还没有。

## 6.5 flags 与双缓冲

18+ 用位掩码，例如 `Placement`、`Update`、`Deletion`、`Passive`、`LayoutMask`。`subtreeFlags` 让 commit 跳过干净子树。

双缓冲仍是 `current` ↔ `alternate`。并发下可能对同一根 **多次 render 才成功 commit**（中间被打断或被更高 Lane 作废）。所以「render 可以跑很多次，commit 才是对用户可见的一次」。Strict Mode 开发环境故意双渲染，就是在模拟「render 被丢掉重来」。

## 6.6 Suspense 在 18 调和器里的位置

组件 `throw promise`（或框架封装的等价物）时，`ReactFiberThrow.js` 找到最近的 `<Suspense>` fiber，把该子树挂成 fallback，并把 retry 登记到 `RetryLane`。Promise resolve 后再走一遍 beginWork。

流式 SSR：服务端遇到未就绪的边界先吐 fallback HTML，后续 chunk 替换。客户端 `hydrateRoot` 按同一套 Fiber 对上。本仓库 Vite SPA **不走** 这条路径，但读 `react-dom/src/server` 时会看到和客户端 work loop 对称的结构。

## 6.7 18 新增 Hook 在源码里的落点

都在 `ReactFiberHooks.js`（以及少量 `react-dom`）：

| Hook | 实现要点 |
| --- | --- |
| `useTransition` | 把后续更新标成 Transition Lane |
| `useDeferredValue` | 先用旧值 commit，新值走低优先级 Lane |
| `useId` | 按树路径生成稳定 id，给 SSR/CSR 对齐 |
| `useSyncExternalStore` | 外存必须同步；并发下用 `getSnapshot` 检测 tearing |
| `useInsertionEffect` | 比 layout 更早，给 CSS-in-JS 插样式 |

`useSyncExternalStore` 存在的原因：并发 render 可能跑到一半被丢掉，如果期间直接读可变外存，屏幕上会撕出不一致的快照。

## 6.8 读 18 源码时别被文件体量吓到

`ReactFiberWorkLoop.js` 很长，里面同时处理：同步/并发、错误恢复、Suspense、hydration、DevTools。抓住三条函数即可：`ensureRootIsScheduled`、`performUnitOfWork`、`commitRoot`。其余都是这两阶段上的分支。

卡颂第八章后半（异步可中断、高优打断、batchedUpdates、Suspense）在书里标了未完成。对应实现就在本章：`shouldYield` + continuation、Lane 抢占（丢 WIP 再重做）、18 自动批处理、`ReactFiberThrow.js`。读 19 的 `use` / RSC 转 [07](./07-react-19-source.md)。
