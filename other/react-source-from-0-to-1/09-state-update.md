# 9. 状态更新

对应 [卡颂第六章](https://react.iamkasong.com/) 实现篇「状态更新」。Didact 的 `setState` 是：把 action 推进数组，再从根排一次工作（[04](./04-function-components-and-hooks.md)）。官方把「一次更新」做成 **Update 对象 + 链表/环**，再按优先级（16 是 expirationTime，**≥18 是 Lane**）决定这一轮算不算它。

卡颂书里的入口还是 `ReactDOM.render` / `this.setState`。19 只保留 `createRoot().render`；class 的 `setState` 仍在，新代码走 Hooks。内部入队函数没变。

## 9.1 心智：更新是一条流水线

任何能让界面变的东西，最后都变成「某个 fiber 上挂一条 Update，再让根被调度」：

```
触发（render / setState / dispatch / 事件里的 setState）
  → 创建 Update { payload, lane, next }
  → 接到 fiber.updateQueue（class）或 hook.queue（函数组件）
  → 根 pendingLanes |= 该 lane
  → ensureRootIsScheduled
  → render 阶段 processUpdateQueue / 跑 hook 的 updateReducer
  → commit
```

没有「立刻改 `this.state`」。你在 `setState` 下一行读到的还是这一次 render 的值，因为 payload 要等下一轮 `processUpdateQueue` 才 fold 进 `memoizedState`。

## 9.2 Update 长什么样

class 组件（`ReactFiberClassUpdateQueue.js`）概念上：

```js
const update = {
  lane,
  tag,        // UpdateState / ReplaceState / ForceUpdate / CaptureUpdate
  payload,    // setState 的对象或函数；render 的 element
  callback,   // setState 第二个参数
  next: null,
}
```

`fiber.updateQueue` 上是环形链表：`shared.pending` 指向最后一次入队的节点，它的 `next` 指向本次批次的第一个。入队是 O(1) 插到环上。

函数组件的 hook 上也有 `queue.pending`，同样是环。`useState` 就是 reducer 为「如果 payload 是函数就 `payload(state)` 否则当新 state」的 `useReducer`。

render 时：

1. 把环剪开变成一条链
2. 按 **当前 `renderLanes`** 过滤：Lane 不在这趟里的 Update **跳过**（留在 baseQueue，等更高优 commit 完再算）
3. 对命中的 payload 做 fold，得到 `memoizedState`

这就是「高优更新先生效、低优 payload 不算丢、之后补算」的实现，Didact 做不到。

## 9.3 触发源对照

| API | 入队点 | 备注 |
| --- | --- | --- |
| `root.render(element)` | HostRoot 的 `updateContainer` | 18+ 替代 `ReactDOM.render` |
| `this.setState` / `this.forceUpdate` | class fiber 的 `enqueueUpdate` | payload 是 partial state 或 updater 函数 |
| `useState` / `useReducer` 的 dispatch | `dispatchSetState` / `dispatchReducerAction` | 可能走 eager 路径：若队列空且 `eagerState === 当前 state`，**不调度** |
| 事件里多次 `setState` | 同一 Lane，合并成一次 render | 18 起 timeout/Promise 里也自动批；17 只有 React 事件里批 |

`flushSync` 强制走同步 Lane，绕开批处理。能不用就不用。

## 9.4 优先级怎么进这条流水线

对齐 [卡颂 · 优先级](https://react.iamkasong.com/concurrent/lane.html) 和 [06](./06-react-18-source.md)。

`requestUpdateLane(fiber)` 看当时的执行上下文：

- 离散输入（click）→ 高优 / Sync
- `startTransition` 包着 → Transition Lane
- 普通 `setState` → Default Lane

同一事件里多次入队，Lane 相同，Scheduler 只醒来一次——这就是批。18 把批从「仅合成事件」扩到所有地方，内部仍是「同 Lane 的 Update 挂在同一条队列上」。

高优打断低优：WIP 丢掉，**不是**把半截 fiber 和点击结果 merge。低优那些 Update 还在 queue 里，高优 commit 之后再开一趟 render 把它们算完。等太久会过期，被抬到同步，防止饿死。

## 9.5 `setState` 在 17 书里 vs 现在

卡颂演示 `ReactDOM.render` 触发的 HostRoot 更新，以及 class `setState` 的 updater 函数。读 19 源码时：

- 不要再搜 `legacyRenderSubtreeIntoContainer` 当主路径
- 搜 `updateContainer`、`dispatchSetState`、`enqueueConcurrentHookUpdate`
- class 的 `processUpdateQueue` 还在；函数组件平行逻辑在 `updateReducer`

开发环境 Strict Mode 会把某些 render **跑两遍**（模拟打断重做）。updater 函数可能执行两次，必须纯：`setCount(c => c + 1)` 可以，`setCount(c => { window.x++; return c + 1 })` 会乱。

## 9.6 和 Didact 差在哪

| Didact | 官方 |
| --- | --- |
| 模块级 `hook.queue` 数组 | fiber/hook 上的 **环** |
| 每次 `setState` 从根无条件重做整棵树 | 有 Lane 才进这趟 `renderLanes`；bailout 可跳过子树 |
| 中途又来更新就扔掉 WIP 从头来 | 同优合并；高优打断后低优 Update 仍在队列里 |
| 没有 `setState(updater)` 以外的 payload | class 还有 replaceState、捕获更新（Error Boundary） |

把这一章和 [08 Diff](./08-diff.md) 接起来：Update 算出新的 `element` 树 → `beginWork` 里 `reconcileChildren` → Diff 打 flags → commit 改 DOM。
