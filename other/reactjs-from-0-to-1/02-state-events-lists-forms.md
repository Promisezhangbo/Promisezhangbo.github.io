# 2. 交互：状态、事件、列表、表单

**版本基线：** 事件系统和 `setState` 从早期就有；下列示例按 **≥16.8 函数组件 + Hooks** 写。事件委托挂载位置在 **17** 从 `document` 改到 **根容器**（微前端场景更重要）。

## 2.1 为什么需要 state

`props` 来自父组件，组件自己要记住的东西（输入框内容、开没开弹窗、请求结果）放 **state**。改 state → 排队一次重渲染 → 再跑组件函数。

```tsx
import { useState } from 'react';

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN((v) => v + 1)}>{n}</button>;
}
```

- `useState(0)` 的 `0` 只在 **首次挂载** 用；后面渲染忽略初始值。
- 需要昂贵初始计算：`useState(() => compute())` **惰性初始化**（**≥16.8**）。
- 更新若和新值 `Object.is` 相同，React **跳过** 重渲染（16.8+ Hook 行为）。

### 函数式更新

```tsx
setN((v) => v + 1); // 基于上一次已排队的值，连点不会丢
setN(n + 1);        // 闭包里的 n 可能是旧的
```

对象/数组要当 **不可变** 数据：复制后改，而不是 `state.push()`。

## 2.2 事件

```tsx
<button type="button" onClick={(e) => { e.preventDefault(); save(); }}>
  保存
</button>
```

- 名称为 `on` + 大驼峰：`onClick`、`onChange`、`onMouseDown`。
- 传入的是 **函数**，不是字符串；不要写成 `onClick={save()}`（那会立刻执行）。
- `e` 是 **合成事件**（跨浏览器包装）。**≥17** 不再对所有事件做「事件池」复用，异步里读 `e.target` 是安全的（16 及以前要 `e.persist()`）。
- **≥17** 原生监听挂在 **你 `createRoot` 的那个 DOM 节点** 上，而不是 `document`。qiankun 多实例并存时，这避免了互相抢 `document` 委托。

捕获阶段：`onClickCapture`。

## 2.3 列表渲染

```tsx
<ul>
  {users.map((u) => (
    <li key={u.id}>
      {u.name}
    </li>
  ))}
</ul>
```

`map` 必须有稳定 `key`（见上一章）。过滤用 `filter` 再 `map`。不要在 `map` 里用 index 去 `splice` 源数组。

## 2.4 表单：受控 vs 非受控

### 受控（推荐作为默认）

值来自 state，每一次按键都走 React：

```tsx
function Search() {
  const [q, setQ] = useState('');
  return <input value={q} onChange={(e) => setQ(e.target.value)} />;
}
```

好处：一份真相、易做校验/禁用提交。坏处：输入也可被重渲染拖住（极少见，真热了再用 `useDeferredValue`，**≥18**）。

### 非受控

值活在 DOM 里，用 ref 读：

```tsx
function FilePicker() {
  const ref = useRef<HTMLInputElement>(null);
  return <input ref={ref} type="file" />;
}
```

文件选择、富文本、和非 React 库集成时常用。`defaultValue` / `defaultChecked` 只作用一次。

**不要** `value` 和 `defaultValue` 混用同一控件。从非受控切到受控会报警。

### 常见控件

| 元素 | 受控值 | 事件 |
| --- | --- | --- |
| `<input>` `<textarea>` | `value` | `onChange` |
| checkbox / radio | `checked` | `onChange` |
| `<select>` | `value`（可多选 `multiple`） | `onChange` |

**≥19** 还可以把函数传给 `<form action={fn}>` 当 Action（见第 7 章），SPA 里仍可用 `onSubmit`。

## 2.5 状态提升（lifting state up）

两个子组件要同步同一份数据 → 把 state 放到 **最近的共同祖先**，通过 props 往下传、通过回调往上报。

```tsx
function Page() {
  const [temp, setTemp] = useState(20);
  return (
    <>
      <Celsius value={temp} onChange={setTemp} />
      <Fahrenheit value={temp} onChange={setTemp} />
    </>
  );
}
```

这是 React 最基本的共享方式。跨很多层再考虑 Context（第 5 章）或状态库（第 8 章）。

## 2.6 派生值不要再开一份 state

能从现有 state/props **算出来** 的，直接算，不要 `useEffect` 里 `setX` 同步：

```tsx
// 好
const fullName = `${first} ${last}`;

// 差：多一次渲染，还容易不同步
useEffect(() => {
  setFullName(`${first} ${last}`);
}, [first, last]);
```

需要「上一次值」才用 effect 或在 event 里算。

## 2.7 异步与过期闭包

```tsx
useEffect(() => {
  let cancelled = false;
  fetchUser(id).then((u) => {
    if (!cancelled) setUser(u);
  });
  return () => {
    cancelled = true;
  };
}, [id]);
```

`id` 快速变化时，后发的请求可能先返回——必须忽略过期响应（或 `AbortController`）。这是 **16.8+ useEffect** 的标准模式，不是 18 才有。

## 2.8 批处理（batching）

同一事件处理器里多次 `setState`，React 会合并成一次渲染：

```tsx
function onClick() {
  setA((x) => x + 1);
  setB((x) => x + 1); // 16 起在事件里就会批
}
```

**≥18** 扩展为：timeout、promise、原生事件回调里也自动批（以前这些路径会渲染两次）。

若必须读到中间 DOM：`flushSync`（少用，会打断并发）。

## 2.9 组合优先于继承

React **不推荐** 组件 class 继承来扩展 UI。用：

- `children` / 具名 slot（`footer={...}`）
- 把组件当 prop：`<Select renderOption={fn} />` 或 `asChild`
- 自定义 Hook 抽逻辑（**≥16.8**）

HOC（`withRouter(Comp)`）是 16 时代遗留，现在多被 Hook 取代。
