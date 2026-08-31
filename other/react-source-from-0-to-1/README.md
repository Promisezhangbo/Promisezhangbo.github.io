# React 源码从 0 到 1

这不是用法教程。用法在 [reactjs-from-0-to-1](../reactjs-from-0-to-1/README.md)。

读法是自顶向下，再落到代码：

1. **理念**（为什么要可中断）：CPU 掉帧 + IO 延迟 → 时间切片 / Suspense  
2. **迷你实现**（怎么跑通）：[Didact](https://pomb.us/build-your-own-react/)  
3. **真实架构**（官方怎么拆）：[《React技术揭秘》](https://react.iamkasong.com/) 的 Scheduler / Reconciler / Renderer  
4. **当前主线**：facebook/react **19.2**（Lane、`use`、RSC、Activity）

卡颂那本书写到 **v17.0.0-alpha**（站点说明），Concurrent 后半（打断、batchedUpdates、Suspense）当时标的是未完成。理念、Fiber、「递/归」、commit 三子阶段、Diff、Update、Hooks 链表到今天仍然适用；入口 API、`effectTag` → `flags`、expirationTime → Lane、19 的 Flight 要以本笔记 6–7 章为准。

本仓库前端是 **React 19.2**。读源码以 [github.com/facebook/react](https://github.com/facebook/react) 的 `main` / `19.2.x` 为准。

## 怎么读

建议：0（理念+地图）→ Didact 1–4 → 5 对照官方 → 8 Diff / 9 Update → 6–7。已经会 Fiber 的人可以从 [00](./00-version-timeline.md) 跳到 5，再补 8、9。

| 顺序 | 文档 | 内容 | 版本基线 |
| --- | --- | --- | --- |
| 0 | [架构时间线](./00-version-timeline.md) | 理念、15/16 分层、Stack → Fiber → Lane → RSC | 查阅 |
| 1 | [`createElement` 与递归 `render`](./01-createElement-and-render.md) | JSX、元素对象、第一次画到 DOM | 对应 **≤15** 心智 |
| 2 | [可中断循环与 Fiber](./02-concurrent-and-fibers.md) | 工作单元；Fiber 三层含义 | Fiber **≥16.0** |
| 3 | [Render / Commit 与调和](./03-commit-and-reconciliation.md) | 双缓冲、「递/归」、`effectList` | **≥16.0** |
| 4 | [函数组件与 `useState`](./04-function-components-and-hooks.md) | dispatcher、hooks 链表 | **≥16.8** |
| 5 | [Didact 对照真实源码](./05-map-to-real-source.md) | `beginWork` / `completeWork` 落点 | 16.8–17 |
| 6 | [React 18：Lane 与并发](./06-react-18-source.md) | Scheduler、Lane、commit 三子阶段 | **≥18.0** |
| 7 | [React 19 / 19.2](./07-react-19-source.md) | `use`、RSC、Actions、Activity | **19.0 / 19.2** |
| 8 | [Diff 算法](./08-diff.md) | 三条限制、单节点 / 多节点 | **≥16.0** |
| 9 | [状态更新](./09-state-update.md) | Update 链表、`setState`、优先级 | **≥16**；Lane **≥18** |

文中版本标记与用法笔记相同：

- **≥16.8**：该版本起源码里就有这条路径
- **仅 16.x / 17 书中写法**：后来被 Lane / flags 替换，读卡颂或老 tag 才看得到原字段名
- 迷你实现里的名字（`parent`、`effectTag`、`requestIdleCallback`）会标明真实源码里的对应物

## 和卡颂章节怎么对

[《React技术揭秘》](https://react.iamkasong.com/) 按理念篇 / 架构篇 / 实现篇排。本笔记不另起一套目录，把对应关系钉在这里：

| 卡颂 | 本笔记 |
| --- | --- |
| 理念：CPU / IO、时间切片 | [00](./00-version-timeline.md) |
| 老架构（15 两层）/ 新架构（16 三层） | [00](./00-version-timeline.md) |
| Fiber 心智、实现、工作原理 | [02](./02-concurrent-and-fibers.md)、[03](./03-commit-and-reconciliation.md) |
| 文件结构、JSX、调试 | [00](./00-version-timeline.md)、[01](./01-createElement-and-render.md) |
| render：`beginWork` / `completeWork` | [03](./03-commit-and-reconciliation.md)、[05](./05-map-to-real-source.md) |
| commit：before mutation / mutation / layout | [06](./06-react-18-source.md) §6.4 |
| Diff：单节点 / 多节点 | [08](./08-diff.md) |
| 状态更新、Update、优先级、`setState` | [09](./09-state-update.md) |
| Hooks 理念、数据结构、`useState`/`useEffect` | [04](./04-function-components-and-hooks.md) |
| Concurrent：Scheduler、Lane | [06](./06-react-18-source.md) |
| （书未写完）打断、batchedUpdates、Suspense | [06](./06-react-18-source.md)、[07](./07-react-19-source.md) 的 `use` |

## 一条最短路径

1. 元素就是 `{ type, props }`；JSX 编译成 `createElement`（或 17+ 的 `jsx()`）
2. Fiber 把递归调用栈摊成链表，才能暂停；节点同时是 **架构 / 静态数据 / 工作单元**
3. **Render 可打断（内存里打标），Commit 不可打断（才改 DOM）**
4. 函数组件没有 DOM；hooks 挂在 fiber 的链表上，靠调用顺序对齐
5. 真实 React 用 **Lane 位掩码 + Scheduler**，不是 `requestIdleCallback`
6. Diff 只比同级，靠 `key`+`type` 决定能不能复用 DOM
7. 19 在同一套 Fiber 上加了 Thenable（`use`）、Flight（RSC）、表单 Action、Activity

## 和本仓库的关系

`apps/*` 跑的是 **浏览器 CSR + Vite**，走 `react-dom/client` 的 `createRoot`。不会碰到 RSC / Flight。源码笔记第 7 章仍然写 RSC，是为了读官方仓库和 Next 时对得上号。
