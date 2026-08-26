# 5. 组合进阶：Context、ref、Portal、Suspense

## 5.1 Context

**旧 API**（`contextTypes` / `getChildContext`）：早期就有，**19 移除**。不要学。

**新 API ≥16.3：**

```tsx
const UserContext = createContext<User | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const value = useMemo(() => user, [user]); // 避免无意义的新引用

  return (
    <UserContext.Provider value={value}>
      <Page />
    </UserContext.Provider>
  );
}

function Avatar() {
  const user = useContext(UserContext); // ≥16.8
  if (!user) return null;
  return <img alt={user.name} src={user.avatar} />;
}
```

Class 订阅：**≥16.6** `static contextType = UserContext`（只能订一份）；或多个 `UserContext.Consumer`。

适用：主题、当前用户、i18n（本仓库 `@packages/i18n` 就是 Provider）。  
不适用：所有跨组件数据都塞一个巨大 context（value 一变，所有消费者渲染）。高频变化的数据用拆 context、状态库或把订阅放到 `useSyncExternalStore`（**≥18**）。

## 5.2 ref

三种历史写法：

| 写法 | 版本 | 现状 |
| --- | --- | --- |
| 字符串 `ref="x"` 然后 `this.refs.x` | 早期 | **19 移除** |
| 回调 `ref={(n) => { this.el = n }}` | 一直可用 | 动态列表偶用 |
| `createRef()` | **≥16.3** | class 用 |
| `useRef()` | **≥16.8** | 函数组件默认 |

`ref` 默认不能像普通 prop 那样从父传到子函数组件（曾被特殊对待）。

- **≥16.3 `forwardRef`：** 包装一层把 ref 接到内部 DOM/组件。
- **≥19：** 函数组件可以把 `ref` 列为普通参数，多数情况 **不必 `forwardRef`**。库若要兼容 18，仍会写 `forwardRef`。

`flushSync` + 读 `ref.current` 可在同一事件里量到最新 DOM，少用。

## 5.3 Portal

**≥16.0** `createPortal(child, domNode)`。

渲染树仍在 React 父组件下（context、事件冒泡按 React 树），DOM 却挂到 `document.body` 等外面。弹层、对话框、浮层避免 `overflow: hidden` 裁剪。

本仓库 Antd Modal 底层就是 portal。

## 5.4 `memo`

**≥16.6** `const C = memo(function C(props) { ... })`。

默认浅比较 props。第三个参数可自定义比较（慎用，容易比漏）。  
父组件每次新箭头函数 `onClick={() => ...}` 会让 `memo` 失效，配合 `useCallback` 或把逻辑下放到子组件自己订阅数据。

## 5.5 `lazy` + `Suspense`（代码分割）

**≥16.6：**

```tsx
const Editor = lazy(() => import('./Editor'));

<Suspense fallback={<p>加载中</p>}>
  <Editor />
</Suspense>
```

`lazy` 只支持 **默认导出** 的动态 `import()`。路由级拆包最常见（React Router 的懒加载页面）。

**16.6 的 Suspense 只为了等代码**，不能正式用来「等任意 Promise」（有过实验 API）。**18** 起并发模式下，框架可以把数据请求接到 Suspense。**19** 的 `use(promise)` 在有缓存时会 suspend。

没有 fallback 的 Suspense 会一直往上找；最外层没有就会到根。

## 5.6 Profiler

**≥16.9** `<Profiler id="Home" onRender={...}>`。DevTools 里看提交耗时。生产可关。

## 5.7 与「非 React 世界」共存

把 jQuery / 地图 / ECharts 放进一个空 `div`，在 `useEffect` 里 `new Chart(el)`，cleanup `dispose()`。React 不要再去改这块 DOM。这是官方认可的「逃生舱」，不是反模式。
