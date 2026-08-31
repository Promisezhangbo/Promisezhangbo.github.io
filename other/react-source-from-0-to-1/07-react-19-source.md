# 7. React 19 / 19.2 源码

**19.0 稳定：2024-12。19.2：2025-10。** 本仓库锁 **19.2**。

调和器骨架仍是第 6 章的 Fiber + Lane + Scheduler。19 是在这套机器上接了几块新引擎：**Thenable（`use`）**、**Flight（RSC）**、**Actions**、以及 19.2 的 **Activity / useEffectEvent**。用法见 [reactjs-from-0-to-1/07](../reactjs-from-0-to-1/07-react-19.md)。

[《React技术揭秘》](https://react.iamkasong.com/) 停在 **17.0.0-alpha**，读完卡颂后用本章接上：`use` 把 IO 瓶颈从「框架 throw promise」收进核心；Flight 是第三种线上载荷；Activity 是 Offscreen 的稳定 API。Fiber / Lane / commit 三子阶段没有换。

## 7.1 仓库里 19 多出来的包

| 包 | 职责 |
| --- | --- |
| `react` | 对外：`use`、`cache`、`Activity`、`useActionState`、`useOptimistic`、`useEffectEvent` |
| `react-dom` | 表单 Action、`useFormStatus`、metadata 提升、`preload*`、resume 预渲染 |
| `react-reconciler` | Thenable、Offscreen/Activity、Hooks dispatcher 新分支 |
| `react-server` | 服务端把组件树编成 Flight 流 |
| `react-client` | 客户端解开 Flight，接成 Client Component fiber |
| `react-server-dom-webpack` 等 | 和打包器约定模块 id、`'use client'` 边界 |

CSR SPA（本仓库）主要仍在 `react` + `react-dom` + reconciler。RSC 相关包只有你接 Next / 自建 Flight 运行时才会进产物。

## 7.2 `use`：render 阶段读 Thenable

**≥19.0。** `use` 不是普通 Hook：可以在条件分支里调用，因为它走的是 **Thenable 协议**，不是 hook 链表的固定槽位（和 `useState` 的 index 规则不同）。

```js
const data = use(promise)
```

源码落点大致在 `ReactFiberThenable.js` / Hooks dispatcher 的 `use`：

1. Promise 还 pending：当前 fiber **throw** 这个 thenable（和 Suspense 同一条 `ReactFiberThrow` 路径）
2. 最近的 `<Suspense>` 显示 fallback；Promise 登记 wakeable，resolve 后按 Retry Lane 再 render
3. 已 resolve：`use` 返回 `result`，组件继续往下走

因此 **每次 render 都 `fetch()` 一个新 Promise** 会反复 suspend。框架用 `cache()` / 模块级 Map 去重。RSC 里 `cache()` 的生命周期在 19.2 可以用 `cacheSignal` 感知结束。

Context 也能 `use(SomeContext)`，内部转到读 context，不 throw。

## 7.3 React Server Components（Flight）

**18 实验，19.0 稳定。** CSR / SSR / RSC **共用 Fiber**，差别是「在哪执行、线上传什么」：

| 模式 | 跑在哪 | 线上传什么 |
| --- | --- | --- |
| CSR | 浏览器 | 无（JS 自己建树） |
| SSR | 服务端 → 浏览器 hydrate | HTML 字符串 |
| RSC | 服务端组件在服务端执行 | **Flight 载荷**（序列化元素树），不是 HTML 也不是组件源码 |

服务端组件：

- 不能用 `useState` / `useEffect` / 浏览器 API
- 可以直接 `await` 数据、碰密钥
- 产物默认 **不进** 客户端 JS 包

`'use client'` 标出边界：这边的模块才打进浏览器，成为 Client Component fiber。服务端传来的树里，client 组件位置是一个「占位 + 引用」，客户端再 hydrate 这块小岛。

读源码：

- 编码：`packages/react-server/src/ReactFlightServer.js`
- 解码：`packages/react-client/src/ReactFlightClient.js`

本仓库是 Vite + qiankun SPA，**没有** Flight 运行时。不要在 `apps/main` 里写 `'use server'`。

## 7.4 Actions 与表单

19 把「异步函数当更新」收进核心。客户端 `<form action={fn}>` 或 `useActionState`：

1. 提交时 React 把这次更新标成 transition 一类（可打断、带 pending）
2. `useFormStatus`（`react-dom`）从最近的 form fiber 读 pending
3. `useOptimistic` 在同一条 transition 里先改一条乐观队列，action 结束后对回真实 state
4. 若函数带 `'use server'`，浏览器不跑函数体，而是发 Flight/HTTP 调用服务端导出

SPA 里用 **不带** `'use server'` 的 async `action` 仍然合法：只走客户端 pending，不碰 RSC。

`useActionState` 在 `ReactFiberHooks.js` 附近，本质是 reducer + 挂起标记，和 `useState` 同一套 hook 链表，多了 action 队列与 pending。

## 7.5 ref 当普通 prop、metadata、资源

- **ref：** 19 起函数组件的 `ref` 出现在 `props.ref`，不必 `forwardRef`。调和器不再把 ref 从 props 里剥掉（对函数组件）。class 仍有独立 ref 路径。
- **文档 metadata：** 客户端渲染 `<title>` / `<meta>` 时，`react-dom` 把它们提升到 `document.head`（host config 里的特殊资源组件）。
- **`preload` / `prefetchDNS` 等：** `react-dom` 的资源提示 API，给框架在 render 时插 hint。

## 7.6 React 19.2

### `<Activity>`

对外组件名 **Activity**；内部长期叫 **Offscreen**（`ReactFiberOffscreenComponent.js` 一类文件）。19.2 稳定了两种 mode：

| mode | 行为 |
| --- | --- |
| `visible` | 正常显示，effect 挂载，更新按普通 Lane |
| `hidden` | 子树 `display: none` 一类隐藏，**保留 state 和 DOM**，effect **cleanup**，更新降到空闲 Lane，不跟前台抢 |

和 `{show && <A />}` 的区别：条件渲染会卸 fiber，state 没了。和纯 CSS 隐藏的区别：Activity 会拆 effect，后台定时器/订阅不会一直跑。

实现上就是给子树挂 Offscreen fiber：hidden 时 `childLanes` 走低优先级，commit 时对 effect 走卸载，节点不删。适合 Tab、返回时还要表单/滚动。

### `useEffectEvent`

把「像事件、但碰巧从 Effect 里触发」的函数从依赖数组里拆出去。实现上是一种 **不订阅 props/state 变化的 hook**：每次 render 更新内部 ref 到最新闭包，identity 稳定，lint 不允许把它当普通依赖。

约束（源码 + `eslint-plugin-react-hooks@6` 会查）：

- 只在定义它的组件/Hook 的 Effect 里调用
- 不要当 prop 传来传去
- 不要为了消 lint 把什么都包进去

### 其它 19.2

- **Performance Tracks：** 向浏览器 Performance 面板上报 React 调度轨道，方便对照 Lane / commit
- **部分预渲染 resume：** `react-dom/server` 的 `resume` / `resumeAndPrerender`，把预渲染结果接着流式补完；SPA 用不到
- **`cacheSignal`：** RSC `cache()` 作用域结束时 abort
- **`useId` 前缀** 调整为 `_r_`

## 7.7 React Compiler（同期生态，不是 19 运行时）

2025-10 前后 Compiler 1.0。它是 **编译期** 自动插入 memo（等价于精细的 `useMemo` / `useCallback` / `React.memo`），**不改** Fiber 算法。

要在 Vite/Babel 接插件才会生效。本仓库未强制开启。读源码去 `react` 组织下的 compiler 仓库，不要在 `react-reconciler` 里找「编译器」。

## 7.8 19 删除的旧路径（读老文章时）

源码和运行时都拿掉了：

- `ReactDOM.render` / `hydrate`
- 字符串 ref
- 旧 Context（`childContextTypes`）
- 函数组件 `defaultProps` 的运行时路径（改参数默认值）

对照 Didact 时：教学里的 `Didact.render(element, container)` 对应的是 **18 以前的入口**；用 19 的脑子翻译，应写成 `createRoot(container).render(element)`。

## 7.9 一张图串 16 → 19.2

```
元素 { type, props }                    一直都在（jsx 运行时换过皮）
        ↓
Fiber 链表 child / sibling / return     ≥16.0
        ↓
beginWork / completeWork / commit       ≥16.0（commit 后来拆成四段）
        ↓
Hooks 链表挂在 memoizedState            ≥16.8
        ↓
Lane + Scheduler + createRoot           ≥18.0
        ↓
use / Flight / Actions                  ≥19.0
        ↓
Activity / useEffectEvent / resume      ≥19.2
```

读最新源码仍然建议：先能在脑子里跑完 Didact 的八步，再打开 `ReactFiberWorkLoop.js`。19 的新文件大多是这条主干上的 **tag 分支** 和 **服务端协议**，不是另一套 React。
