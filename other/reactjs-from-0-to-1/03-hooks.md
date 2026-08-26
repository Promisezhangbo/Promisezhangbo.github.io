# 3. Hooks 详解

**版本：≥16.8.0（2019-02-06）稳定。** 所有 React 相关包（`react`、`react-dom`）必须 ≥16.8，否则运行时会坏。

Hooks 让 **函数组件** 使用 state、副作用、上下文等，而不写 class。Class 没有被删除，但新代码默认函数组件。

## 3.1 规则（两条，ESLint 会管）

1. **只在顶层调用 Hook**（不要放进 `if` / 循环 / 嵌套函数）。
2. **只在 React 函数组件或自定义 Hook** 里调用。

原因：Hook 状态按 **调用顺序** 存在 Fiber 上的链表。条件调用会让下一轮对错位。

请装 `eslint-plugin-react-hooks`（`rules-of-hooks` + `exhaustive-deps`）。本仓库用 Oxlint，同样覆盖一部分规则。

自定义 Hook：**名字以 `use` 开头**，内部再调其他 Hook，用来复用逻辑（不是复用 UI）。

```tsx
function useOnline() {
  const [on, setOn] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const go = () => setOn(true);
    const off = () => setOn(false);
    window.addEventListener('online', go);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', go);
      window.removeEventListener('offline', off);
    };
  }, []);
  return on;
}
```

---

## 3.2 16.8 内置 Hook

### `useState`

见第 2 章。多个相关字段可以：

- 多个 `useState`（简单独立字段）
- 一个对象 `useState({...})`（要一起变的快照）
- 逻辑复杂用 `useReducer`

### `useReducer`

```tsx
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'inc':
      return { n: state.n + 1 };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { n: 0 });
// 惰性：useReducer(reducer, arg, initFn)  // ≥16.8
```

`dispatch` 引用 **稳定**，适合往深子树传「发动作」而不用 `useCallback`。

### `useEffect`

在 **提交到 DOM 之后** 异步跑（paint 后），适合订阅、请求、改 `document.title`。

```tsx
useEffect(() => {
  const t = setInterval(() => tick(), 1000);
  return () => clearInterval(t); // cleanup：下次 effect 前或卸载时
}, [tick]);
```

依赖数组：

| 写法 | 含义 |
| --- | --- |
| 无第二个参数 | 每次渲染后都跑（几乎总是错的） |
| `[]` | 只在挂载后跑一次，卸载 cleanup |
| `[a, b]` | `a` 或 `b` 变了才跑 |

比较用 `Object.is`。对象/函数每次渲染都是新引用 → 会每轮重跑。需要稳定引用时用 `useCallback` / `useMemo`，或不要把「仅事件用到的值」塞进 effect（**19.2 `useEffectEvent`**）。

**开发 + Strict Mode（≥18）：** mount 时 effect 会跑两次以检查 cleanup。生产只有一次。

### `useLayoutEffect`

签名同 `useEffect`，但在 **DOM 更新后、浏览器 paint 前** 同步执行。用于测量布局、避免闪烁。SSR 没有布局，服务端会警告，需要改 `useEffect` 或判断环境。

### `useContext`

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light'); // createContext ≥16.3

function Title() {
  const theme = useContext(ThemeContext); // ≥16.8
  return <h1 data-theme={theme}>...</h1>;
}
```

`Provider` 的 `value` 若每次 render 都是新对象，所有消费者都会重渲染。把 value `useMemo` 或拆开。

### `useRef`

```tsx
const el = useRef<HTMLDivElement>(null);
const count = useRef(0); // 改 .current 不触发渲染
```

- 挂 DOM：`<div ref={el} />`
- 记任意可变盒（定时器 id、上一次 props）：**改 `current` 不会重渲染**

`useRef(fn)` 不会每轮重跑 `fn`；初始值只记一次。

### `useMemo` / `useCallback`

```tsx
const filtered = useMemo(() => items.filter(ok), [items]);
const onSave = useCallback(() => save(id), [id]);
```

- `useMemo`：缓存 **计算结果**
- `useCallback(fn, deps)` ≡ `useMemo(() => fn, deps)`，缓存 **函数引用**

用途：减轻昂贵计算；保持传给 `memo` 子组件的 props 稳定。  
**不是** 默认每个函数都要包一层。没测量就加，往往无收益。React Compiler（2025）会自动做一部分。

### `useImperativeHandle`

**≥16.8**，配合 `forwardRef`：限制父组件通过 ref 能调哪些方法。

```tsx
useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), []);
```

**≥19** 子组件可以直接声明 `ref` prop，不一定再包 `forwardRef`（见第 7 章）。

### `useDebugValue`

给自定义 Hook 在 DevTools 里显示标签。日常业务很少写。

---

## 3.3 18.0 新增 Hook

**版本：≥18.0（2022-03）。** 需要 `createRoot`，旧 `ReactDOM.render` 拿不到完整并发能力。

### `useId`

生成 SSR/CSR 一致的唯一 id（无障碍 `htmlFor` / `aria-*`）。不要用它做列表 `key`。

**19.2** 默认前缀改为 `_r_`，以便能当 CSS `view-transition-name`。

### `useTransition`

把更新标成「可中断的非紧急更新」，输入框保持跟手：

```tsx
const [isPending, startTransition] = useTransition();

function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  setQuery(e.target.value); // 紧急：输入框
  startTransition(() => setListFilter(e.target.value)); // 可推迟：大列表
}
```

也有独立函数 `startTransition(fn)`（不在组件里也能调）。

### `useDeferredValue`

把某个值的「滞后版」交给重 UI：

```tsx
const deferred = useDeferredValue(query);
return <HugeList query={deferred} />;
```

和 `useTransition` 同类问题，API 更贴「延迟这个值」而不是「包一块 setState」。

### `useSyncExternalStore`

订阅外部 store（Redux、浏览器 API），并在并发下读到 **一致快照**，避免 tearing。状态库作者用得多；应用侧偶尔包 `subscribe` + `getSnapshot`。

### `useInsertionEffect`

在 DOM 变更前插入样式（CSS-in-JS 库用）。应用代码几乎不直接用。

---

## 3.4 19.0 新增

**版本：≥19.0（2024-12）。**

### `use(promise | context)`

在 render 里 **读取** Promise 或 Context。Promise 未完成则 **suspend**（需要上层 `Suspense`）。可写在条件语句里（这点和普通 Hook 不同）。

```tsx
const data = use(fetchUser(id)); // 需配合 cache/去重，避免每次 render 新 Promise
```

客户端 SPA 里更常见的仍是 `useEffect` + 状态库 / React Query。`use` + Promise 在 RSC / 框架 fetch 缓存里更自然。

### `useOptimistic`

乐观更新：先显示目标 UI，请求失败再回滚。

### `useActionState`（原实验名 `useFormState`）

把 Action 的结果、pending 收成 state，常配 `<form action={...}>`。

### `useFormStatus`（`react-dom`）

在 **表单子组件** 里读父 `<form>` 是否正在提交。必须放在 form 内部。

详见 [07-react-19.md](./07-react-19.md)。

---

## 3.5 19.2 `useEffectEvent`

**版本：≥19.2（2025-10）。**

把「像事件、但发生在 effect 里」的逻辑拆出去：回调 **总是读到最新** props/state，**不必**放进 effect 依赖，因此不会因为 `theme` 变了就重新连 WebSocket。

```tsx
const onConnected = useEffectEvent(() => {
  showToast(`已连接（主题 ${theme}）`);
});

useEffect(() => {
  const conn = connect(roomId);
  conn.on('open', () => onConnected());
  return () => conn.disconnect();
}, [roomId]); // 不要把 onConnected 写进 deps
```

不要用它来「关掉 exhaustive-deps」；只用于真正的事件型逻辑。需要最新 eslint-plugin-react-hooks。

---

## 3.6 Effect 心智（比 API 更重要）

官方现在强调：**Effect 是和外部系统同步**，不是「数据变了就 set 另一份数据」的管道。

该用 event / 渲染计算时就不要上 effect。常见过度使用：

- 根据 `firstName+lastName` `setFullName` → 直接拼接
- 用户一点击就 `useEffect` 里发请求 → 放在 `onClick` 里
- 所有 props 变化都 reset state → 给组件换 `key`

## 3.7 和 class 生命周期对照（便于读老代码）

| Class | 大致对应 |
| --- | --- |
| `constructor` 里 `this.state` | `useState` 初始值 |
| `componentDidMount` | `useEffect(..., [])` |
| `componentDidUpdate` | `useEffect(..., [deps])`（每次更新含首次，要注意） |
| `componentWillUnmount` | effect 的 cleanup |
| `shouldComponentUpdate` / `PureComponent` | `memo` + 稳定 props |
| `componentDidCatch` | **无 Hook**，仍用 class Error Boundary |

`componentDidUpdate` 不会在 mount 跑；`useEffect` **会在 mount 后跑**。迁移时要核对。
