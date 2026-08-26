# 6. React 18：并发渲染

**版本：≥18.0.0（2022-03-29）。** 本仓库已是 19，但 18 这套入口和心智仍然是基础。

## 6.1 必须换渲染入口

```tsx
// ≥18（19 唯一支持的方式）
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
// 卸载：root.unmount()
```

```tsx
// 17 及以前；18 弃用；19 删除
ReactDOM.render(<App />, document.getElementById('root'));
```

SSR 对应 **`hydrateRoot`**，不要再用 `ReactDOM.hydrate`。

不换 `createRoot`：新 Hook（`useTransition` 等）和自动批处理行为不完整。

## 6.2 并发是什么

JS 仍是单线程。并发的意思是：React **可以暂停、放弃一次未完成的渲染**，先去处理更紧急的更新（点击、输入），再回来画重的结果。

- **紧急更新：** 输入、点击，要立刻反映。
- **过渡更新：** `startTransition` 包起来的，可被打断。

用户体感：大列表过滤时输入框不卡死。开发体感：Strict Mode 双调用 effect，有些「只挂载一次」的假设会破。

## 6.3 自动批处理扩大

17：只有 React 事件里多 `setState` 会合并。  
**18：** `setTimeout`、Promise、原生 addEventListener 里也合并成一次渲染。

若旧代码依赖「setA 之后立刻在下一行看到 DOM 已更新」，18 之后会坏。极少数用 `flushSync`。

## 6.4 新 Hook 速查

完整说明见 [03-hooks.md](./03-hooks.md) 第 3.3 节：

- `useId`
- `useTransition` / `startTransition`
- `useDeferredValue`
- `useSyncExternalStore`
- `useInsertionEffect`

## 6.5 Suspense 在 18 的变化

- 代码分割继续用。
- 数据：官方希望框架把 fetch 接到 Suspense（Next、Relay 等）。自己 `throw promise` 的土法在 18 客户端能跑，但缺少缓存容易死循环。
- **流式 SSR：** `renderToPipeableStream`（**≥18**），HTML 可以一块块刷出，Suspense fallback 先到浏览器。

本仓库 Vite SPA **没有** 用流式 SSR。

## 6.6 Batching、Transition 和 `useDeferredValue` 怎么选

| 手段 | 场景 |
| --- | --- |
| 什么都不包 | 普通表单、少量 DOM |
| `startTransition` | 你清楚「这次 setState 可以慢一点」 |
| `useDeferredValue` | 已经有一个紧急 state，派生一份延迟值给重子树 |
| `memo` / 虚拟列表 | 并发也救不了 1 万行 DOM，还得少画 |

## 6.7 18.3

没有新模型，主要是 **升 19 之前的弃用警告**（`defaultProps` 在函数组件上、一些旧 API）。看到警告再对照 [00-version-timeline.md](./00-version-timeline.md) 的移除表。
