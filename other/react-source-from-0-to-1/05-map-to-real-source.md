# 5. Didact 对照真实源码（16.8–17）

Pombo 写 Didact 的目的之一：变量名、函数名尽量和官方一致，方便你在真实调用栈里对上号。本章把教学实现钉到 **facebook/react** 里，并列出原文 Epilogue 说的「React 多做了什么」。

读 tag 时：**16.8–17.x** 仍能看到 expirationTime；**18+** 同一文件里换成 Lane / flags。骨架没变。

## 5.1 调用栈怎么对

在真实应用的函数组件里打一个断点，开发构建下大致是：

```
workLoopSync / workLoopConcurrent     ReactFiberWorkLoop.js
  performUnitOfWork                   ReactFiberWorkLoop.js
    beginWork                         ReactFiberBeginWork.js
      updateFunctionComponent         ReactFiberBeginWork.js
        renderWithHooks               ReactFiberHooks.js
          YourComponent()             你的源码
```

Didact 把 `beginWork` + `completeWork` 揉进一个 `performUnitOfWork`。官方 **向下** 调和、**向上** 创建 host 实例：

```js
// 概念对齐，不是源码摘抄
function performUnitOfWork(unitOfWork) {
  const next = beginWork(current, unitOfWork, renderLanes)
  if (next === null) {
    completeUnitOfWork(unitOfWork) // 内部调 completeWork
  } else {
    workInProgress = next
  }
}
```

- `beginWork`：调用户组件、`reconcileChildren`
- `completeWork`：`document.createElement`、把子节点的 effect 冒泡到 `subtreeFlags`

Didact 在 begin 阶段就 `createDom`；官方 host 实例多在 complete 时创建，这样子节点先 complete，父节点才能一次挂好孩子。

## 5.2 名字对照表

| Didact | 真实源码（约 16.8+） |
| --- | --- |
| `createElement` | `react` 包 `createElement` / 17+ `jsx` |
| `render` | 17：`ReactDOM.render`；18+：`root.render` → `updateContainer` |
| `nextUnitOfWork` | 模块级 `workInProgress` |
| `performUnitOfWork` | 同名 |
| `workLoop` | `workLoopSync` / `workLoopConcurrent` |
| `parent` | **`return`** |
| `dom` | host 组件的 **`stateNode`** |
| `wipRoot` | `FiberRoot.current.alternate`（WIP 根 fiber） |
| `currentRoot` | `FiberRoot.current` |
| `alternate` | 同名 |
| `effectTag` | **`flags`** 位掩码（16 后期已开始换） |
| `deletions` 数组 | fiber 上的 `deletions`，再冒泡 |
| `wipFiber.hooks` 数组 | **`memoizedState` 链表** |
| `hookIndex` | 遍历 `hook.next` |
| `requestIdleCallback` | **`scheduler` 包** |

## 5.3 原文 Epilogue：官方多做的五件事

教学实现为了短，省略了生产环境必需的优化。对照 16.8+ 源码：

### 1. Render 可以跳过整棵子树

Didact 每次从根把整棵树走一遍。官方用 `bailout`：props 没变、没有 pending update、context 没变，则 `beginWork` 直接复用旧 child fiber，子树不进 `updateFunctionComponent`。`React.memo`、`PureComponent`、hooks 的 `bailoutOnAlreadyFinishedWork` 都走这条。

### 2. Commit 只访问有 effect 的节点

Didact 的 `commitWork` 递归整棵树。官方 complete 时把 `flags` 向上或到 `subtreeFlags`；commit 若子树 flag 为 0 就整枝跳过。另有一条 **effect list**（16 早期更明显）：只把「需要改 DOM / 跑 effect」的 fiber 串起来。

### 3. Fiber 对象会复用

Didact 每次 WIP 都 `new` 一堆对象。官方 `createWorkInProgress` 优先拿 `current.alternate` 那块内存改字段，双缓冲两套节点轮流当 current / WIP，减少 GC。

### 4. 更新带优先级，而不是推倒重来

Didact 在 render 中途又来一次 `setState`，会丢掉整棵 WIP，从根再来。16 用 `expirationTime` 决定这次算不算、能不能被打断；**18 换成 Lane**（[第 6 章](./06-react-18-source.md)）。高优先级更新可以打断低优先级 WIP，打断后低优先级工作会 **重做**，不是和半成品合并。

### 5. 还有一整层 renderer / 事件 / DevTools

合成事件、受控表单、Suspense、Error Boundary、Profiler、hydration，教学里都没有。它们都挂在同一套 Fiber 上，不另起一套调和器。

## 5.4 16 → 17 源码上你能看见的变化

| 点 | 17 做了什么 |
| --- | --- |
| 事件委托 | 从 `document` 改到 **root 容器**（`ReactDOMRoot`） |
| JSX | 新运行时 `jsx()`，产物不必 `import React` |
| 对外 API | 「无新特性」大版本，方便渐进升级 |
| 内部 | Lane 已在实验路径出现，稳定并发仍要等 18 |

对读 Fiber 主路径影响不大：`WorkLoop` / `BeginWork` / `Hooks` 文件还在。

## 5.5 打开仓库的建议顺序

1. `packages/react/src/jsx/ReactJSXElement.js` — 元素长什么样  
2. `packages/react-reconciler/src/ReactFiber.js` — 节点字段  
3. `ReactFiberWorkLoop.js` — 搜 `performUnitOfWork`  
4. `ReactFiberBeginWork.js` — 搜 `updateFunctionComponent`  
5. `ReactFiberHooks.js` — 搜 `updateReducer` / `mountWorkInProgressHook`  
6. `ReactFiberCommitWork.js` — 搜 `commitMutationEffects`  

然后带着「Didact 缺了优先级」去读 18 的 `ReactFiberLane.js`。
