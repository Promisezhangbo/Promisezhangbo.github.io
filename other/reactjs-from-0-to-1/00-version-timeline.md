# 0. React 版本时间线与特性对照

React 的「大版本」并不等于「每年一个新框架」。很多今天每天用的 API 是在 **16.x 的小版本**里加的（Hooks 是 16.8，不是 17）。

## 大版本一览

| 版本 | 稳定发布时间 | 一句话 |
| --- | --- | --- |
| 0.14 | 2015 | `react` 与 `react-dom` 拆包；函数组件出现 |
| 15 | 2016-04 | 主要是堆栈调和器上的改进，API 变化不大 |
| **16.0** | 2017-09 | **Fiber** 重写；Fragments、Error Boundary、Portal、自定义 DOM 属性 |
| 16.3 | 2018-03 | 新 Context、`createRef`、`forwardRef`、新生命周期 |
| 16.6 | 2018-10 | `memo`、`lazy`、`Suspense`（代码分割）、`contextType` |
| **16.8** | 2019-02 | **Hooks 稳定** |
| 16.9 | 2019-08 | `UNSAFE_` 前缀；`<Profiler>` |
| **17.0** | 2020-10 | 「无新特性」大版本；事件委托改挂到根节点；为渐进升级铺路 |
| 17 + 新 JSX 运行时 | 2020-10 配套 | 不必 `import React from 'react'` 才能写 JSX |
| **18.0** | 2022-03 | **并发渲染**、`createRoot`、自动批处理、若干新 Hook |
| 18.3 | 2024 | 为升 19 打的弃用警告 |
| **19.0** | 2024-12 | Actions、`use`、RSC 稳定、ref 作 prop、文档 metadata |
| 19.1 | 2025-03 | 稳定补强 |
| **19.2** | 2025-10 | `Activity`、`useEffectEvent`、Performance Tracks；本仓库在用 |

补丁号（如 19.2.7）一般是安全/回归修复，不引入新心智模型。

## 按主题：API 从哪一版开始

### 组件模型

| 知识点 | 版本 | 说明 |
| --- | --- | --- |
| 函数组件（无 state） | **≥0.14** | 当时叫 stateless function |
| 类组件 `React.Component` | **≥0.13 / 0.14** | ES6 class；15/16 仍是主流写法 |
| 类组件 `PureComponent` | **≥15.3** | 浅比较 props/state |
| Hooks 函数组件可以有状态 | **≥16.8** | 今日默认写法 |
| `memo` | **≥16.6** | 函数组件浅比较，对标 PureComponent |

### JSX 与渲染入口

| 知识点 | 版本 | 说明 |
| --- | --- | --- |
| JSX | 一开始 | 需 Babel/TS 编译 |
| `React.createElement` | 一开始 | JSX 的编译目标（经典运行时） |
| 新 JSX 运行时 `jsx()` | **≥17** | `jsx: react-jsx`；不必为了 JSX 引入 `React` |
| `ReactDOM.render` | 经典 | **18 弃用，19 移除** |
| `createRoot` / `root.render` | **≥18.0** | 并发特性的入口 |
| `hydrate` | SSR 经典 | **18 起改用 `hydrateRoot`** |

### 状态与副作用

| 知识点 | 版本 |
| --- | --- |
| `this.state` / `setState`（class） | 早期 |
| `useState` `useEffect` `useContext` `useRef` `useReducer` `useMemo` `useCallback` `useLayoutEffect` `useImperativeHandle` `useDebugValue` | **≥16.8** |
| `useId` `useTransition` `useDeferredValue` `useSyncExternalStore` `useInsertionEffect` | **≥18.0** |
| `use` `useOptimistic` `useActionState` `useFormStatus` | **≥19.0** |
| `useEffectEvent` | **≥19.2** |

### 数据流与组合

| 知识点 | 版本 |
| --- | --- |
| props / children / 单向数据流 | 一开始 |
| 旧 Context（`getChildContext`） | 早期；**19 移除** |
| 新 Context（`createContext`） | **≥16.3** |
| `contextType`（class 订阅单个 context） | **≥16.6** |
| `createRef` | **≥16.3**（取代字符串 ref、callback ref 仍可用） |
| `forwardRef` | **≥16.3**；**19 起多数场景不必再用**（ref 是普通 prop） |
| Portal | **≥16.0** |
| Fragments `<>` | **16.0** 长语法；**16.2** 短语法 |
| Error Boundary | **≥16.0**（只有 class；函数组件至今无官方等价物，常用包模拟） |

### 并发、懒加载、服务端

| 知识点 | 版本 |
| --- | --- |
| Fiber 架构 | **16.0** |
| `React.lazy` + `Suspense` 切代码 | **≥16.6** |
| `Suspense` 等数据（非官方框架里能力有限） | **18** 部分；**19** 与 RSC/`use` 更完整 |
| Concurrent rendering / `startTransition` | **≥18.0** |
| Automatic batching 在异步里也批 | **≥18.0** |
| React Server Components | 18 实验；**19.0 稳定**（通常靠 Next 等框架，不单用 CRA） |
| Form Actions / `<form action={fn}>` | **≥19.0** |
| `<Activity>` | **≥19.2** |
| React Compiler 1.0 | **2025-10**（编译器，不是 React 运行时大版本） |

## 明确废弃 / 移除（读老代码时用）

| API | 废弃 | 移除 | 替代 |
| --- | --- | --- | --- |
| `ReactDOM.render` / `unmountComponentAtNode` | 18 | **19** | `createRoot` / `root.unmount` |
| 字符串 ref `ref="foo"` | 很早 | **19** | `useRef` / `createRef` |
| 旧 Context API | 16.3 起不推荐 | **19** | `createContext` |
| `componentWillMount` 等未加 `UNSAFE_` 的名 | **16.9** 弃用 | 后续逐步 | `componentDidMount` 或 Hooks |
| `UNSAFE_componentWillMount` 等 | 16.9 起带前缀 | 仍能见到 | 迁到新生命周期或函数组件 |
| `defaultProps` 在函数组件上 | 19 更强调参数默认值 | 函数组件上弱化 | `function C({ n = 1 })` |
| `PropTypes` 内置 | 15.5 拆到 `prop-types` | — | TypeScript |
| `mixins` | 早期 | 实质死亡 | HOC / Hooks / 组合 |
| `findDOMNode` | 不推荐已久 | 尽量不用 | ref |
| `react-test-renderer` 若干旧 API | 随 19 | 看 changelog | `@testing-library/react` |

## 学习时不要搞混的三件事

1. **16.8 ≠ 必须升到 17。** 很多「Hooks 项目」卡在 16.14 也能跑，只是没有并发渲染。
2. **18 的并发是「可中断渲染」，不是多线程。** 仍在 JS 单线程里用优先级调度。
3. **19 的 Server Components 不是 `useEffect` 里 fetch 的语法糖。** 它是另一套运行时（服务端组件不能用 state/effect）。本仓库是 Vite SPA + qiankun，**没有 RSC**。
