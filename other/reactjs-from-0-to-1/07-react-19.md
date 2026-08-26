# 7. React 19 与 19.2

**19.0 稳定：2024-12。19.2：2025-10。** 本仓库 `apps/*` 依赖 `react@^19.2`。

19 在 18 并发之上，把「表单提交 / 乐观 UI / 服务端组件 / 资源加载」收进核心。很多能力 **在框架（Next.js App Router）里最完整**；纯 Vite SPA 也能用其中一部分。

## 7.1 ref 成为普通 prop

```tsx
function Input({ ref, ...rest }: React.ComponentProps<'input'>) {
  return <input ref={ref} {...rest} />;
}

<Input ref={elRef} />;
```

**≥19** 不必为了转 ref 写 `forwardRef`（仍然可用，给 18 双版本库）。TypeScript 需 `@types/react` 19。

## 7.2 文档 metadata 与资源

客户端组件里可以直接：

```tsx
<title>{pageTitle}</title>
<meta name="description" content={desc} />
<link rel="canonical" href={url} />
```

React 会把它们提升到 `document.head`。本仓库 SEO 目前更多走 `@packages/seo` 的 `applyDocumentSeo`，和这条官方能力是同一问题的两种做法。

资源提示：`preload`、`prefetchDNS` 等（`react-dom`），给框架预加载 CSS/字体。

## 7.3 Actions 与表单

把「异步函数」当成更新的一等公民：自动 pending、错误、可搭配乐观更新。

```tsx
async function saveAction(formData: FormData) {
  'use server'; // 这是 RSC/服务端指令，纯 SPA 里不要抄这一行
  await api.save(String(formData.get('name')));
}

<form action={saveAction}>
  <input name="name" />
  <button type="submit">保存</button>
</form>
```

纯客户端也可以 `action={async (formData) => { ... }}`，提交后 React 会处理 pending。

### `useActionState` ≥19.0

```tsx
const [state, formAction, pending] = useActionState(async (prev, formData) => {
  const err = await submit(formData);
  return err;
}, null);
```

### `useFormStatus` ≥19.0（`react-dom`）

子组件读取最近的 `<form>` 是否 pending，做按钮 loading。必须渲染在该 form 内部。

### `useOptimistic` ≥19.0

```tsx
const [optimistic, addOptimistic] = useOptimistic(todos);
function onAdd(text: string) {
  addOptimistic([...optimistic, { text, pending: true }]);
  startTransition(() => save(text));
}
```

## 7.4 `use` ≥19.0

见 [03-hooks.md](./03-hooks.md)。注意：每次 render 都 `fetch()` 新 Promise 会重复 suspend。需要和框架的 `cache()` 或你自己的 Map 去重。

## 7.5 Server Components（RSC）

**18 实验，19.0 稳定。** 组件默认在 **服务端** 跑完，把序列化结果发给客户端。服务端组件：

- **不能** `useState` / `useEffect` / 浏览器 API
- **能** 直接 `await db.query()`、读密钥（只在服务端）
- 通过 `'use client'` 边界把交互小岛交给客户端组件

本仓库是 **浏览器里的 Vite + qiankun SPA**，没有 RSC 运行时。不要在 `apps/main` 里写 `'use server'`。若以后用 Next 再学这一层。

## 7.6 从 18 升 19 时会碰到的删除

必须先清掉（否则 19 直接挂）：

- `ReactDOM.render` → `createRoot`
- 字符串 ref
- 旧 Context API
- 部分 `propTypes` 运行时路径（本来就该用 TS）

函数组件 `defaultProps` 改为参数默认值。

## 7.7 React 19.2 增量

**2025-10-01。**

### `<Activity>`

在「条件卸载」和「一直挂着」之间：

```tsx
import { Activity } from 'react';

<Activity mode={tab === 'a' ? 'visible' : 'hidden'}>
  <PanelA />
</Activity>
```

- `hidden`：`display: none`，**保留 state 和 DOM**，effect **会 cleanup**（不白占订阅），更新降到空闲时再做。
- `visible`：正常显示，effect 再挂上。

适合 Tab 切走还要记住滚动/表单，又不要后台定时器一直跑。

### `useEffectEvent`

见第 3 章。把 effect 里的「事件回调」和「响应式依赖」拆开。

### 其它

- Performance 面板里的 React tracks（DevTools/浏览器性能分析）
- 部分预渲染 resume API（流式 SSR / 静态，SPA 用不到）
- `useId` 前缀 `_r_`

### React Compiler 1.0（同期生态，2025-10）

编译器自动插入 memo，减少手写 `useMemo`/`useCallback`。**不是**换 React 大版本就自动开启，要在构建链里接 Babel/Vite 插件。本仓库尚未作为默认强制项。

## 7.8 和本仓库的关系

你现在写页面，优先：

1. 函数组件 + 16.8 Hooks
2. `createRoot`（应用入口已由 Vite 模板处理）
3. 19：需要转 ref 就当普通 prop
4. 不要为了「用新的」去上 RSC / form Action；Antd 表单 + `onSubmit` 仍然正确

并发、`useTransition` 在超大表格/搜索时再加。
