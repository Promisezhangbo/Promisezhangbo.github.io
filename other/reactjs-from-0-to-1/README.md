# React 从 0 到 1

面向「会 JS，要从头把 React 学扎实」的笔记。每个知识点都标了 **首次稳定出现的版本**；本仓库当前是 **React 19.2 + React Router 7 + Vite**。

官方文档：[react.dev](https://react.dev)（跟 19.x）。旧大版归档：`18.react.dev` / `16.react.dev`。

## 怎么读

建议按序号走。已经会 Hooks 的人可以直接看 [00 版本时间线](./00-version-timeline.md)，再跳到 18 / 19。

| 顺序 | 文档 | 内容 | 建议版本基线 |
| --- | --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 0.14 → 19.2 特性对照、废弃清单 | 全程查阅 |
| 1 | [核心思想与 JSX](./01-core-ideas.md) | 组件、JSX、props、渲染、key | 任意；Fiber 起于 **16.0** |
| 2 | [交互：状态、事件、列表、表单](./02-state-events-lists-forms.md) | 单向数据流、受控组件、状态提升 | 函数组件写法按 **16.8+** |
| 3 | [Hooks 详解](./03-hooks.md) | 规则、内置 Hook、依赖数组、常见坑 | **16.8** 起；18/19 新 Hook 单独标注 |
| 4 | [类组件与生命周期](./04-class-lifecycle.md) | 对照表、何时还会碰到 class | **0.14–16** 遗产；新项目可略读 |
| 5 | [组合进阶](./05-composition-advanced.md) | Context、ref、Portal、Error Boundary、Suspense | **16.0–16.6** |
| 6 | [React 18：并发渲染](./06-react-18-concurrent.md) | `createRoot`、自动批处理、Transition | **18.0** |
| 7 | [React 19](./07-react-19.md) | Actions、`use`、RSC、ref 作 prop、Activity | **19.0 / 19.2** |
| 8 | [生态与本仓库](./08-ecosystem.md) | Router、状态库、构建、和本 monorepo 的对应关系 | 实践 |

文中版本标记约定：

- **≥16.8**：该版本起可用（含之后的大版本）
- **仅 16.x**：只在那一代有意义，或随后被替代
- **已废弃 / 已移除**：标明废弃版本与移除版本

## 一条最短路径（新项目，直接按 19 学）

1. JSX + 函数组件 + `props` / `children`
2. `useState` / `useEffect` / `useRef`（**16.8**）
3. 列表 `key`、受控表单、状态提升
4. `useContext` + 自建 Hook
5. `createRoot`（**18.0**，不要再用 `ReactDOM.render`）
6. 知道 `useTransition` / `Suspense` 是干什么的
7. 19：`ref` 直接当 prop；表单 Actions 可选

类组件、`UNSAFE_*` 生命周期、字符串 ref、旧 Context（`childContextTypes`）**不必先学**，在维护老代码时再查第 4 章。
