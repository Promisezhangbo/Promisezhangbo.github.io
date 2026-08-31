# 4. 函数组件与 `useState`

对应原文 **Step VII–VIII**，也就是 **React 16.8** 那一层：函数也可以有状态，状态不在 class 实例上，而在 **fiber 上的 hooks 列表**。

## 4.1 函数组件和 host 差两点

```jsx
function App(props) {
  return <h1>Hi {props.name}</h1>
}
const element = <App name="foo" />
```

编译后 `type` 是函数本身：

```js
function App(props) {
  return Didact.createElement('h1', null, 'Hi ', props.name)
}
const element = Didact.createElement(App, { name: 'foo' })
```

和 `div` 相比：

1. 这个 fiber **没有** DOM（`fiber.dom == null`）
2. children **不是** `props.children`，而是 **执行这个函数** 的返回值

```js
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) return fiber.child
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.parent
  }
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}
```

`fiber.type(fiber.props)` 就是你写的 `function App`。调和算法不用改。

官方对应 `ReactFiberBeginWork.js`：按 `fiber.tag` 分支到 `updateFunctionComponent`、`updateHostComponent`、`updateClassComponent` 等。函数名和 Didact **故意对齐**，所以在真实应用的函数组件里打断点，调用栈里仍能看到 `performUnitOfWork` → `updateFunctionComponent`。

## 4.2 Commit：父节点可能没有 DOM

函数组件夹在中间时，`fiber.parent.dom` 可能是 `null`。插入和删除都要向上（或向下）找到最近的 host fiber。

```js
function commitWork(fiber) {
  if (!fiber) return

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}
```

官方 host 父节点查找是 `getHostParentFiber` 一类辅助函数；删除要处理 Fragment、Portal 等更多 tag。

## 4.3 `useState`：挂在 fiber 上的数组

经典计数器：

```jsx
function Counter() {
  const [state, setState] = Didact.useState(1)
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
}
```

调用 `useState` 时，当前正在 `updateFunctionComponent` 里执行用户函数。需要在调用前准备好「现在这个 fiber 是谁、第几个 hook」。

```js
let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })

  const setState = (action) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}
```

读这段时按时间顺序：

1. **首次 render**：没有 `alternate.hooks`，`state = initial`，`queue` 空
2. **点击**：`setState` 并不立刻改 `hook.state`，只把 action 推进 `queue`，然后像 `render()` 一样排一次从根开始的新工作
3. **下一次 `updateFunctionComponent`**：用 **旧 hook 的 queue** 逐个 apply 到新 hook 的 state，再返回给组件

这就是「更新是异步的、下次渲染才看到新值」的迷你版。官方 `enqueueConcurrentHookUpdate` 之后走 Lane，不会每次都从根无条件重做整棵树，但 **queue + 下次 render 再 fold** 这个模型一样。

## 4.4 为什么 hooks 必须按顺序调用

对齐靠的是 **`hookIndex`，不是 hook 的名字**。`if` 里调用 `useState` 会让两次 render 的 index 对不上，旧 state 会被安到错误的 hook 上。规则来自实现，不是风格偏好。

官方不用数组而用 **链表**：`fiber.memoizedState` 指向第一个 hook，每个 hook 的 `next` 指向下一个。Didact 用数组更易读，语义相同。源码：`ReactFiberHooks.js` 的 `updateWorkInProgressHook`。

## 4.5 Didact 完整实现（Step VIII）

下面是 Pombo 文末那一版，可直接对照 [didact 仓库](https://github.com/pomber/didact)。省略 `createElement` / `updateDom` 时见前几章。

```js
function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }
  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })
  const setState = (action) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }
  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

const Didact = { createElement, render, useState }
```

## 4.6 原文没做、你可以接着加的

Pombo 文末列的作业，官方都有：

| 作业 | 官方对应 |
| --- | --- |
| `style` 对象 | `react-dom` 把对象展开成 CSS 文本 |
| 打平 children 数组 | `React.Children` / JSX 运行时已处理 |
| `useEffect` | commit 后的 passive effects |
| 按 `key` 调和 | `ReactChildFiber.js` |

下一章把 Didact 的名字一一钉到 **16.8–17** 的真实文件上，并列出官方多出来的优化。18/19 的 Lane、`use`、RSC 在第 6、7 章。
