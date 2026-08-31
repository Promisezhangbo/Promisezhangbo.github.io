# 1. `createElement` 与递归 `render`

对应原文 **Step Zero–II**。[Build your own React](https://pomb.us/build-your-own-react/) 把官方库叫 **Didact**（didactic）。本章先丢掉 React，用原生 DOM 把同一棵树画出来，再自己实现 `createElement` 和第一次 `render`。

心智对应 **React ≤15**：一次递归走完整棵树，中途不能停。真实 15 还有 class、合成事件、批量更新，教学实现都不做。

## 1.1 三行应用里到底发生了什么

```jsx
const element = <h1 title="foo">Hello</h1>
const container = document.getElementById('root')
ReactDOM.render(element, container)
```

JSX 不是 JS。Babel / TypeScript 会把它收成函数调用。经典运行时（**≥17 之前默认**；之后也可选）：

```js
const element = React.createElement('h1', { title: 'foo' }, 'Hello')
```

`createElement` 几乎只做一件事：返回一个普通对象（**React element**）。教学里只关心两个字段：

```js
{
  type: 'h1',
  props: { title: 'foo', children: 'Hello' },
}
```

- `type`：字符串就是 host 组件（对应 `document.createElement` 的 tag）；函数是组件，[第 4 章](./04-function-components-and-hooks.md) 再处理。
- `props.children`：可能是字符串，更常见是子元素数组。所以 **element 本身就是树**。

术语：本文用 **element** 指 React 元素对象，用 **node** 指真实 DOM。

## 1.2 不用 React，手动画同一棵树

```js
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello',
  },
}

const container = document.getElementById('root')
const node = document.createElement(element.type)
node.title = element.props.title

const text = document.createTextNode('')
text.nodeValue = element.props.children

node.appendChild(text)
container.appendChild(node)
```

文本不用 `innerText`，而用 `createTextNode`，是为了后面把「文本」也当成一种 element（`TEXT_ELEMENT`），和标签走同一套逻辑。

## 1.3 自己写 `createElement`

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child),
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
```

`children` 用 rest，保证永远是数组。原始值（字符串、数字）包成 `TEXT_ELEMENT`。

官方 **不会** 把原始值预先包成元素，也 **不会** 在没有 children 时造空数组。Didact 为了少写分支故意简化。真实入口：

- 经典：`packages/react/src/jsx/ReactJSXElement.js` 的 `createElement`
- **≥17** 新 JSX 运行时：同样的对象，函数名是 `jsx` / `jsxs`（静态子节点已知时用 `jsxs`）

告诉 Babel 用我们的函数而不是 `React.createElement`：

```js
/** @jsx Didact.createElement */
```

今日项目一般是 `"jsx": "react-jsx"`，不会再看到这条 pragma。

## 1.4 第一次 `render`：递归创建 DOM

只处理「第一次挂载」，更新和删除在 [第 3 章](./03-commit-and-reconciliation.md)。

```js
function render(element, container) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type)

  const isProperty = (key) => key !== 'children'
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach((child) => render(child, dom))
  container.appendChild(dom)
}

const Didact = { createElement, render }
```

流程：按 `type` 建节点 → 抄 props → 对每个 child 递归 → `appendChild`。到这里已经能把 JSX 画到页面上。

## 1.5 这一步的致命问题

`render` 是同步递归。树一大，主线程会被占满，点击、动画、输入都得等整棵树走完。这就是 15 的 Stack Reconciler 卡顿来源，也是下一章要把工作拆成 **单元** 的原因。

真实 React 15 的递归发生在 `reconcileChildren` 一类函数里；16 起这段递归被 Fiber 的 while 循环替换，见 [02](./02-concurrent-and-fibers.md)。

## 1.6 本章完整代码

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child),
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: { nodeValue: text, children: [] },
  }
}

function render(element, container) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type)

  Object.keys(element.props)
    .filter((key) => key !== 'children')
    .forEach((name) => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach((child) => render(child, dom))
  container.appendChild(dom)
}

const Didact = { createElement, render }

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
Didact.render(element, document.getElementById('root'))
```
