# React 源码从 0 到 1

这不是用法教程。用法在 [reactjs-from-0-to-1](../reactjs-from-0-to-1/README.md)。

本文从零搭一个能跑的迷你 React（Didact），再对照 **facebook/react** 仓库里 **16 → 19.2** 的真实实现。迷你实现走 [Rodrigo Pombo《Build your own React》](https://pomb.us/build-your-own-react/)（2019，对应 **React 16.8** 架构）。官方源码按当前主线 **19.2** 讲。

本仓库前端是 **React 19.2**。读源码时以 [github.com/facebook/react](https://github.com/facebook/react) 的 `main` / `19.2.x` 为准；函数名、文件名会随小版本微调，心智模型从 18 起已经稳定。

## 怎么读

建议按序号走完 Didact（1–4），再读「对照真实源码」（5），然后 18 / 19（6–7）。已经会 Fiber 的人可以从 [00](./00-version-timeline.md) 跳到 5。

| 顺序 | 文档 | 内容 | 版本基线 |
| --- | --- | --- | --- |
| 0 | [架构时间线](./00-version-timeline.md) | Stack → Fiber → Lane → RSC，包结构 | 查阅 |
| 1 | [`createElement` 与递归 `render`](./01-createElement-and-render.md) | JSX、元素对象、第一次把树画到 DOM | 对应 **≤15** 心智 |
| 2 | [可中断循环与 Fiber](./02-concurrent-and-fibers.md) | 工作单元、`child`/`sibling`/`parent` | Fiber **≥16.0** |
| 3 | [Render / Commit 与调和](./03-commit-and-reconciliation.md) | 双缓冲、`effectTag`、增删改 | **≥16.0** |
| 4 | [函数组件与 `useState`](./04-function-components-and-hooks.md) | 无 DOM 的 fiber、hooks 数组 | **≥16.8** |
| 5 | [Didact 对照真实源码](./05-map-to-real-source.md) | 同名函数落点、官方多做了什么 | 16.8–17 |
| 6 | [React 18 源码：Lane 与并发](./06-react-18-source.md) | Scheduler、Lane、`createRoot`、commit 四段 | **≥18.0** |
| 7 | [React 19 / 19.2 源码](./07-react-19-source.md) | `use`、RSC、Actions、Compiler、Activity | **19.0 / 19.2** |

文中版本标记与用法笔记相同：

- **≥16.8**：该版本起源码里就有这条路径
- **仅 16.x**：后来被 Lane / flags 等替换，读老 tag 才看得到
- 迷你实现里的名字（`parent`、`effectTag`、`requestIdleCallback`）会标明真实源码里的对应物

## 一条最短路径

1. 元素就是 `{ type, props }`；JSX 编译成 `createElement`（或 17+ 的 `jsx()`）
2. Fiber 把递归调用栈摊成链表，才能暂停
3. **Render 可打断，Commit 不可打断**
4. 函数组件没有 DOM；hooks 挂在 fiber 的链表上，靠调用顺序对齐
5. 真实 React 用 **Lane 位掩码 + Scheduler**，不是 `requestIdleCallback`
6. 19 在同一套 Fiber 上加了 Thenable（`use`）、Flight（RSC）、表单 Action、Activity

## 和本仓库的关系

`apps/*` 跑的是 **浏览器 CSR + Vite**，走 `react-dom/client` 的 `createRoot`。不会碰到 RSC / Flight。源码笔记第 7 章仍然写 RSC，是为了读官方仓库和 Next 时对得上号。
