# 0. 架构时间线与仓库地图

用法 API 的时间线在 [reactjs-from-0-to-1/00](../reactjs-from-0-to-1/00-version-timeline.md)。这里只记 **调和器怎么演进**，以及打开官方仓库时该进哪个包。

理念与 15→16 分层，对齐 [卡颂《React技术揭秘》理念篇](https://react.iamkasong.com/preparation/idea.html)（书中源码基线 **17.0.0-alpha**）。

## 理念：快速响应要拆两道瓶颈

官网原话可以收成一句：**用 JS 构建能快速响应的大型 Web 应用**。卡颂把拖慢响应的原因分成两类，架构几乎都是围着它们转的：

| 瓶颈 | 用户感知 | React 的解 |
| --- | --- | --- |
| **CPU** | 大树一次递归算完，超过一帧 **16.6ms**（60Hz），JS 和 GUI 线程互斥，掉帧 | **时间切片**：每片大约 **5ms**（`frameYieldMs`），把长任务拆开，把主线程还给布局/绘制 |
| **IO** | 网络回来之前界面要么空白要么 loading 闪一下 | **Suspense / 过渡**：先在当前界面多停一小会儿请求数据；太久再显示 fallback。19 的 `use` 仍走这条 |

时间切片的前提是：**同步更新变成可中断的异步更新**。15 做不到（递归 + 边调和边改 DOM），所以 16 重写 Reconciler。

16 有 Fiber 结构，**不等于** 16 的 `ReactDOM.render` 会切片。切片作为稳定默认行为，要 **18 `createRoot`**。卡颂文里的 `unstable_createRoot` 就是这条路的实验名。

## 大版本：引擎换了几次

| 版本 | 时间 | 引擎 | 一句话 |
| --- | --- | --- | --- |
| ≤15 | 2016 前 | **Stack Reconciler** | 同步递归，调用栈就是工作栈；树一大就卡主线程 |
| **16.0** | 2017-09 | **Fiber** | 把栈帧改成堆上的链表节点；为可中断渲染铺路 |
| 16.8 | 2019-02 | 同一套 Fiber | Hooks：状态从 class 实例搬到 fiber.memoizedState |
| 17 | 2020-10 | 同一套 Fiber | 事件委托挂到根；JSX 新运行时；内部开始用 Lane 试验 |
| **18.0** | 2022-03 | Fiber + **Lane** + 默认并发入口 | `createRoot`；`requestIdleCallback` 早就不在主路径 |
| **19.0** | 2024-12 | 同一套 + **Flight / `use`** | RSC 稳定；Actions；ref 当普通 prop |
| **19.2** | 2025-10 | 同一套 | `<Activity>`、`useEffectEvent`、部分预渲染 resume |

**16 有 Fiber，不等于 16 有并发。** 16/17 的 `ReactDOM.render` 仍然是同步把树走完。并发要 **18 的 `createRoot`** 才作为稳定入口打开。

Didact 对应的是 **16.8 的架构草图**：Fiber + 可中断循环 + 函数组件 + 一个 `useState`。Lane、Scheduler、Suspense、RSC 都不在那篇文章里。

## 15 两层 vs 16 三层

对齐 [老架构](https://react.iamkasong.com/preparation/oldConstructure.html) / [新架构](https://react.iamkasong.com/preparation/newConstructure.html)。

**React 15：**

```
Reconciler（递归找出变化） ⇄ Renderer（立刻改宿主）
```

两层 **交替** 工作：调和完一个 `li` 就插入 DOM，再调和下一个。过程是同步的，用户看起来像同时更新。若中途能打断（15 实际不会），屏幕上会出现 `123` 变成 `223` 这种半截 UI。这就是 Didact 第 2 章「边 `appendChild` 边走树」的真实版本问题。

**React 16+：**

```
Scheduler（谁先做、做多久）
    ↓ 有剩余时间 / 按优先级
Reconciler（只在内存里给 Fiber 打 Placement / Update / Deletion）
    ↓ 整棵树的 render 结束
Renderer（同步按标记改 DOM）
```

Scheduler 本可以是 `requestIdleCallback`。官方不用它：兼容性差；切后台 tab 后回调会变得极慢。于是自研 `packages/scheduler`（卡颂称为 rIC 的完备 polyfill），额外带优先级。Reconciler 与 Renderer **不再交替**：render 全程内存，commit 一次性交给 Renderer。

`react-reconciler` 是平台无关包，`react-dom` 只是其中一种 Renderer。

## 调度模型怎么换

| 时期 | 优先级怎么表达 | 让出主线程 |
| --- | --- | --- |
| Didact / 教学 | 无优先级 | `requestIdleCallback` |
| 16 早期 Fiber | `expirationTime`（一个数字，越早越急） | Scheduler（后来独立成包） |
| **≥18** | **Lane**：31 位掩码，多种更新可并存 | `packages/scheduler`，默认 **~5ms** 时间片，用 `MessageChannel` 续跑 |

Lane 替换 expirationTime 的原因：一个数字排不出「同一棵树里同时有点击更新和 transition」；位掩码可以并存、批量合并、被更高位抢占。

## 官方仓库包结构（19.x）

读 [facebook/react](https://github.com/facebook/react) 时，和渲染相关的包：

```
packages/
  react/                 对外 API：createElement、Hooks、Activity、use
  react-dom/             浏览器渲染器：createRoot、DOM 属性、事件、SSR
  react-reconciler/      核心：Fiber、work loop、beginWork/completeWork/commit
  scheduler/             独立调度器：优先级队列 + 时间片
  react-client/          RSC 客户端：解 Flight 流
  react-server/          RSC 服务端：序列化组件树
  react-server-dom-*     接 webpack / turbopack 的 Flight 绑定
```

**Reconciler 与 Renderer 分离** 从 16 就是设计目标：同一套 `react-reconciler` 驱动 `react-dom`、`react-native`、测试渲染器。Didact 把两层写在一个文件里。

调和器里最常打开的文件（路径相对于 `packages/react-reconciler/src/`）：

| 文件 | 职责 |
| --- | --- |
| `ReactFiber.js` | Fiber 节点构造 |
| `ReactFiberWorkLoop.js` | `performUnitOfWork`、同步/并发 work loop、进入 commit |
| `ReactFiberBeginWork.js` | 向下：调组件函数、调和子节点 |
| `ReactFiberCompleteWork.js` | 向上：创建 host 实例、冒泡 `subtreeFlags` |
| `ReactFiberCommitWork.js` | 真正改 DOM / 跑 layout 与 passive effect |
| `ReactFiberReconciler.js` | 对渲染器暴露的 `updateContainer` 等 |
| `ReactFiberHooks.js` | `useState` / `useEffect` / `use` 的 dispatcher |
| `ReactFiberLane.js` | Lane 常量与 `getNextLanes` |
| `ReactFiberRootScheduler.js` | 根节点如何挂到 Scheduler |

`react-dom` 侧入口：**≥18** 看 `packages/react-dom/src/client/ReactDOMRoot.js`（`createRoot`）。

## 双缓冲这件事先记下来

真实 React 始终维护两棵 Fiber 树：

- **current**：屏幕上正在显示的那棵
- **workInProgress（WIP）**：正在算的下一棵

对应节点用 `alternate` 互指。Commit 成功后把根上的 current 指针一换，WIP 变成 current。Didact 的 `currentRoot` / `wipRoot` 就是这件事的教学版。

根上还有一层：`fiberRootNode`（真正的根容器对象）指向 `rootFiber`。`current` 指针挂在 **FiberRoot** 上，不是某个组件 fiber 上。mount 时会先创建一棵空的 current 树，所以 **rootFiber 从一开始就有 `alternate`**，后面 `beginWork` 才能走「update 打标」而不是给每个新节点都打 `Placement`（见 [05](./05-map-to-real-source.md) / [卡颂 beginWork](https://react.iamkasong.com/process/beginWork.html)）。

## 和本仓库

锁的是 **react@19.2**。读源码用 19.2 tag 或 `main` 都可以；Lane / work loop / Hooks 链表从 18 到 19.2 没有换骨架。19 新增集中在 Thenable、Flight、表单、Activity，见 [07](./07-react-19-source.md)。
