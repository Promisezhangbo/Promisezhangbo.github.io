# 3. Render / Commit 与调和

对应原文 **Step V–VI**。两件关键设计从这里定型，一直用到 React 19：

1. **Render 阶段**只建 fiber 树，可被打断
2. **Commit 阶段**一次性改 DOM，不能打断
3. 下一轮 render 拿 **上一轮 commit 完的树** 做 diff（reconciliation）

## 3.1 为什么不能边算边改 DOM

上一章每个 fiber 都立刻 `appendChild`。若 `workLoop` 在中途 `shouldYield`，屏幕上会留下半棵树。

对策：render 阶段 **禁止** 碰 DOM。记一棵正在构建的根：`wipRoot`（work in progress root）。`nextUnitOfWork` 变成 `null` 说明本轮算完，再 `commitRoot()` 一次性挂上去。

```js
function commitRoot() {
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) return
  const domParent = fiber.parent.dom
  if (fiber.dom) {
    domParent.appendChild(fiber.dom)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop)
}
```

`performUnitOfWork` 里删掉 `appendChild`，只 `createDom` + 建子 fiber。

这就是官方一直沿用的两阶段。卡颂把 **15 会露出半截 DOM** 说得很清楚：当时 Reconciler 和 Renderer 交替，一个 `li` 改完再调和下一个。16 起两段拆开，render 只打标。18+ 的 commit 还会再拆 before mutation / mutation / layout / passive，见 [06](./06-react-18-source.md)；「render 可中断、commit 同步」这条不变。

## 3.1.1 「递」和「归」

Didact 一个 `performUnitOfWork` 做完所有事。官方拆成两段，卡颂称为深度优先的 **递** 和 **归**（[beginWork](https://react.iamkasong.com/process/beginWork.html) / [completeWork](https://react.iamkasong.com/process/completeWork.html)）：

```
performUnitOfWork
  ├─ beginWork（递）  创建或复用 **子** fiber，返回 child
  └─ 没有 child 了
        completeWork（归）  Host 组件在这里创建 DOM、appendAllChildren
        然后找 sibling；没有 sibling 就 return 到父节点再 complete
```

`completeWork` 对 `HostComponent` 会 `appendAllChildren`：把已经 complete 的子孙 DOM 挂到当前节点上。归到 root 时，内存里已经有一棵 **离屏 DOM 树**。首屏 commit 往往只需把这棵树一次性插入容器——这就是下面「只给 root 打 Placement」的原因。

16/17 还会在归的过程中把有副作用的节点串成 **`effectList`**（`firstEffect` / `lastEffect` / `nextEffect`）。commit 只遍历这条链表，不走完整棵树。18+ 更多靠 `subtreeFlags` 跳过干净子树，链表不如早期显眼，思想一样。

## 3.2 双缓冲：`currentRoot` 与 `alternate`

要做更新，必须记得「上次已经画到屏幕上的那棵树」。commit 结束后：

```js
currentRoot = wipRoot
```

每个新 fiber 带一个 `alternate`，指向 **上一棵 current 树上的对应节点**。官方同样用 `alternate` 把 current ↔ WIP 成对连起来。Commit 成功后交换根指针，旧 WIP 变成新 current。

`render` 现在创建带 `alternate` 的 root：

```js
function render(element, container) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot,
  }
  deletions = []
  nextUnitOfWork = wipRoot
}
```

## 3.3 `reconcileChildren`：同位置、比 type

把「给 children 建 fiber」从 `performUnitOfWork` 抽出来。一边走 **新 elements 数组**，一边走 **旧 fiber 链表**（`wipFiber.alternate.child` 起）。

每一对 `(element, oldFiber)`：

| 条件 | 动作 | `effectTag` |
| --- | --- | --- |
| 两边都有，且 `type` 相同 | 复用 `oldFiber.dom`，换新 props | `UPDATE` |
| 有新 element，type 不同或没有旧节点 | 新建 fiber，`dom: null` | `PLACEMENT` |
| 有旧 fiber，type 不同或没有新 element | 旧节点要删 | `DELETION`（打在 **旧** fiber 上） |

```js
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber = null
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    if (oldFiber) oldFiber = oldFiber.sibling

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }
    prevSibling = newFiber
    index++
  }
}
```

删除打在旧 fiber 上，而 commit 从 **WIP 根** 往下走，WIP 上没有这些旧节点。所以要另存 `deletions` 数组，commit 时先处理删除。

官方更进一步：用 `key` 做同级匹配，列表换位不必卸掉整个 DOM。Didact **故意不做 key**。真实算法仍是 O(n) 启发式：type 不同就整棵子树拆掉重建；同级靠 `key` 找可复用节点。实现在 `reconcileChildFibers`（`ReactChildFiber.js`），展开见 [08 Diff](./08-diff.md)。

`mountChildFibers` 和 `reconcileChildFibers` 几乎是同一个工厂函数，差别只有 `shouldTrackSideEffects`：

- **update**（`current !== null`）：给新 fiber 打 `Placement` / 给旧的打 `Deletion`
- **mount**（`current === null`）：**不打** Placement。否则首屏每个节点都插入一次，DOM 操作极差

首屏仍然能出现在页面上，是因为 **rootFiber 一开始就有 current**（FiberRoot 上那棵空树），root 走 `reconcileChildFibers`，只有根子树带一次 `Placement`；commit 把 complete 阶段拼好的离屏 DOM **一次**插进容器。详见 [卡颂 beginWork · effectTag](https://react.iamkasong.com/process/beginWork.html)。

## 3.4 Commit 时按 tag 改 DOM

```js
function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) return
  const domParent = fiber.parent.dom

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

`updateDom` 对比新旧 props：去掉消失的、写入新的；`on*` 走 `addEventListener` / `removeEventListener`。

```js
const isEvent = (key) => key.startsWith('on')
const isProperty = (key) => key !== 'children' && !isEvent(key)
const isNew = (prev, next) => (key) => prev[key] !== next[key]
const isGone = (prev, next) => (key) => !(key in next)

function updateDom(dom, prevProps, nextProps) {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = ''
    })

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name]
    })

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}
```

官方 **≥16** 用位掩码 `flags`（`Placement | Update | Deletion | ...`），不再用字符串 `effectTag`。**≥18** 还用 `subtreeFlags` 在 complete 时向上冒泡：「这棵子树有没有 effect」。Commit 就可以跳过干净的子树。Didact 每次 commit 都走完整棵树。

## 3.5 事件：教学 vs 官方

Didact 把监听直接挂在节点上。真实 `react-dom` 长期是 **委托**：16 挂在 `document`，**17** 改挂到 **root 容器**，便于一页多 React 根、也减少和其它库抢事件。19 仍是根上委托 + 内部优先级映射到 Lane。

## 3.6 到这里的全局状态

```js
let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null
```

四个变量已经能讲清 16 的主路径。真实根对象是 `FiberRoot`（`ReactFiberRoot.js`），上面还有 `pendingLanes`、`callbackNode` 等；教学里用模块级变量代替。

下一章：`type` 是函数时没有 `fiber.dom`，以及 `useState` 怎么挂上 fiber。
