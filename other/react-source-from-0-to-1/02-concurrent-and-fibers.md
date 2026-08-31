# 2. 可中断循环与 Fiber

对应原文 **Step III–IV**。目标：把「一次递归走完整棵树」改成「每次只做一个很小的工作单元，做完可以交给浏览器」。

真实世界：**Fiber 数据结构和可中断循环是 16.0 引入的**；对外可用的并发 API（`createRoot`、`startTransition`）是 **18.0**。Didact 用 `requestIdleCallback` 演示「可让出」；官方从很早就不走这条 API，见文末对照。

## 2.1 为什么递归必须拆掉

上一章的 `render(child, dom)` 一旦开始，JS 调用栈会一直长到叶子。浏览器不能在递归中途处理输入。

做法：

1. 把工作切成 **unit of work**
2. 每做完一个单元，检查要不要把主线程还回去
3. 下次空闲再从「下一个单元」接着做

```js
let nextUnitOfWork = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)
```

`requestIdleCallback` 可以想成「浏览器觉得闲了再调你」，并带一个 `deadline`。Pombo 原文已经写明：**React 不用它了，改用独立的 `scheduler` 包，概念相同。**

16/17 稳定版的循环更接近「有活就一口气做完」：

```js
while (nextUnitOfWork) {
  nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
}
```

并发循环要到 18 才成为默认路径。

## 2.2 Fiber：给每个 element 一个工作单元

需要一种结构，让「下一个单元」好找。这就是 **fiber tree**：每个 element 对应一个 fiber，每个 fiber 是一个 unit of work。

举例：

```jsx
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container,
)
```

`render` 只创建 **root fiber**，设成 `nextUnitOfWork`。真正干活在 `performUnitOfWork`，每个 fiber 做三件事：

1. 创建（或之后：提交）DOM
2. 为 children 创建 fiber
3. 返回下一个要处理的 fiber

为了找下一个节点，fiber 上挂三条指针（Didact 命名）：

| Didact | 真实源码 | 含义 |
| --- | --- | --- |
| `child` | `child` | 第一个子 fiber |
| `sibling` | `sibling` | 下一个兄弟 |
| `parent` | **`return`** | 父节点 |

官方不叫 `parent`，叫 `return`：[卡颂的解释](https://react.iamkasong.com/process/fiber.html) 是——作为工作单元，子节点做完 `completeWork` 之后 **返回** 的下一个节点就是父节点。这是在模拟调用栈的 `return`，不是家谱术语。

## 2.2.1 Fiber 的三层含义

卡颂把 Fiber 拆成三句话，读 `ReactFiber.js` 字段时按这三类看，不会晕：

| 含义 | 是什么 | 典型字段 |
| --- | --- | --- |
| **架构** | 16 的 Reconciler 叫 Fiber Reconciler，相对 15 的 stack Reconciler | `return` / `child` / `sibling` 把节点连成树 |
| **静态数据结构** | 每个节点对应一个 React element | `tag`、`key`、`type`、`elementType`、`stateNode`（DOM） |
| **动态工作单元** | 这一次更新要干什么 | `pendingProps` / `memoizedProps`、`updateQueue`、`memoizedState`、`flags`（旧名 `effectTag`）、`lanes` |

另外还有 `alternate`：指向「另一棵树」上的自己（current ↔ WIP）。

心智模型（[Fiber 心智](https://react.iamkasong.com/process/fiber-mental.html)）：可中断更新像代数效应里的 `try`/`handle`——算到一半把中间状态留下，浏览器要时间就让出，回来接着干。JS 没有纤程，React 用链表把栈帧搬到堆上自己模拟。Generator 也是代数效应的一种体现，但官方调和器 **没有** 用 Generator 实现 work loop。

遍历规则（深度优先）：

1. 有 `child` → 下一个就是 child（`div` 做完去 `h1`）
2. 没有 child、有 `sibling` → 去兄弟（`p` 做完去 `a`）
3. 都没有 → 回到 parent，找 parent 的 sibling（`a` 做完去 `h2`）
4. 一路回到 root 且 root 也没有 sibling → 本轮 render 的单元全部做完

这就是把递归调用栈 **摊到堆上**：暂停时只需记住 `nextUnitOfWork` 指向哪个 fiber。

## 2.3 实现 `performUnitOfWork`（先只管挂载）

先把「创建 DOM 并立刻 append」暂时放在这里。下一章会发现这会画出残缺 UI，再拆出去。

```js
function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  Object.keys(fiber.props)
    .filter((key) => key !== 'children')
    .forEach((name) => {
      dom[name] = fiber.props[name]
    })
  return dom
}

function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: { children: [element] },
  }
}

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
  while (index < elements.length) {
    const element = elements[index]
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }

  if (fiber.child) return fiber.child
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.parent
  }
}
```

要点：

- DOM 存在 `fiber.dom` 上（真实源码 host 组件用 `stateNode`）
- 第一个 child 挂 `fiber.child`，其余用 `sibling` 串成链表
- 返回值决定循环的下一步

## 2.4 和真实 Fiber 节点差在哪

官方 `createFiber`（`ReactFiber.js`）字段多得多。读 18/19 时至少会碰到：

```js
// 教学压缩版，不是可运行源码
const fiber = {
  tag,          // FunctionComponent / HostComponent / HostRoot / ...
  type,         // 函数或 'div'
  key,
  child,
  sibling,
  return,       // Didact 的 parent
  pendingProps,
  memoizedProps,
  memoizedState, // hooks 链表头
  stateNode,    // Didact 的 dom
  flags,        // Didact 的 effectTag，但是位掩码
  alternate,    // 双缓冲另一棵树上的对应节点
  lanes,
  childLanes,
}
```

`tag` 用数字枚举区分函数组件、class、原生 DOM、Fragment 等，避免每次 `typeof type === 'function'`。

## 2.5 调度：教学 vs 官方

| | Didact | 真实 React（≥18） |
| --- | --- | --- |
| 让出 API | `requestIdleCallback` | `packages/scheduler`，内部 `MessageChannel.postMessage` |
| 时间片 | `deadline.timeRemaining() < 1` | 默认 `frameYieldMs ≈ 5`，一帧 16.67ms 里留出布局/绘制 |
| 为何不用 rIC | — | 页面忙时可能一直不回调；嵌套 `setTimeout(0)` 有 4ms 下限 |

源码对应：

- 循环：`ReactFiberWorkLoop.js` 的 `workLoopConcurrent` / `workLoopSync`
- 是否让出：Scheduler 的 `shouldYield`
- 入口：`performUnitOfWork` → `beginWork`（向下）→ 返回后 `completeWork`（向上）

Didact 把「创建子 fiber」和「创建 DOM」都塞进 `performUnitOfWork`。官方拆成 **begin（向下调和）** 和 **complete（向上创建 host 实例）** 两段，见 [05](./05-map-to-real-source.md)。

## 2.6 本章问题：半截 UI

现在每处理一个 fiber 就 `appendChild`。循环可能在树走完之前被打断，用户会看到缺胳膊少腿的界面。解决办法：计算和改 DOM 分开 —— [下一章](./03-commit-and-reconciliation.md)。
