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

独立包 `packages/scheduler`。React 把「这个 root 有活」登记进去，到期回调 `performConcurrentWorkOnRoot`。

要点：

- 默认时间片 **`frameYieldMs` ≈ 5ms**（`Scheduler.js` / `forks/Scheduler.js`）。16.67ms 一帧里留出布局、绘制、输入。
- 续跑不用 `requestIdleCallback`，用 **`MessageChannel.port.postMessage`**：页面忙时 rIC 可能永不回调；嵌套 `setTimeout(0)` 有 4ms 下限。
- 任务带 Scheduler 优先级（Immediate / UserBlocking / Normal / Low / Idle），和 Lane **不是同一套数字**，中间有一层映射。

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

文件：`packages/react-reconciler/src/ReactFiberLane.js`。

16 的 `expirationTime` 是一个数字，很难表达「树上同时挂着点击更新和 transition」。Lane 用 **位**：每个 bit 一类工作，可以并存、按位或合并、按最高有效位先做。

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
