# 1. 核心思想与 JSX

**版本基线：** JSX / 组件 / props 从 React 诞生就有；**Fiber 调和器 ≥16.0（2017-09）**；新 JSX 运行时 **≥17**。

## 1.1 React 是什么

React 是用 **组件** 描述 UI 的库（不是完整框架）。你声明「数据长这样时 UI 长那样」，由 React 计算 DOM 更新。

核心约定：

- **UI = f(state)**：同一组 props + state，渲染结果应一致（纯渲染；副作用放到 effect）。
- **单向数据流**：数据从上往下（props），事件从下往上报（回调）。
- **组件是函数或类**：输入 props，输出 React 元素树（不是直接操作 DOM）。

和 Vue 的直觉差异：React 默认 **不做细粒度模板依赖收集**，一次 `setState` 会让该组件函数 **重新执行**；要想少渲染，用 `memo` / 拆组件 / 编译器（见第 6、7 章）。

## 1.2 元素、组件、实例

| 名词 | 释义 |
| --- | --- |
| **React 元素** | `{ type, props, key, ref }` 这类描述对象，廉价、不可变 |
| **组件** | `type` 为函数或 class 时，React 会调用它得到下一层元素 |
| **宿主组件** | `type` 为 `'div'` 等字符串，对应真实 DOM |
| **实例** | class 的 `this`；函数组件每次渲染就是一次调用，没有持久 `this`（state 存在 Hook 链表上） |

```tsx
const element = <Welcome name="Ada" />;
// 大致相当于
const element = { type: Welcome, props: { name: 'Ada' } };
```

**≥16.0 Fiber：** 每个元素对应树上一个 Fiber 节点，可被拆成小单位工作、可暂停（18 的并发建立在这上面）。15 及以前是「一次调和必须跑完」的 stack reconciler。

## 1.3 JSX

JSX 是语法糖，不是 HTML。

```tsx
const el = (
  <button type="button" className="ok" disabled={busy} onClick={onSave}>
    {busy ? '保存中' : '保存'}
  </button>
);
```

要点：

- 表达式用 `{ }`，不能直接写 `if`/`for`（可写成三元、`&&`、先算变量）。
- DOM 属性用 **camelCase**：`className`、`htmlFor`、`tabIndex`、`onClick`。
- 布尔属性：`disabled={true}` 或 `disabled`；要取消传 `false` / `undefined`。
- 内联样式是对象：`style={{ marginTop: 8 }}`，数值默认 `px`（除了 `lineHeight` 等）。
- `{}` 里 `false`、`null`、`undefined`、`true` **不渲染**；`0` **会渲染成 0**（列表为空时常踩坑：`count && <List />` 在 `count===0` 时画出 0）。

### JSX 编译目标

| 时期 | tsconfig / Babel | 编译结果 |
| --- | --- | --- |
| 经典 | `"jsx": "react"` | `React.createElement(...)`，文件必须能访问 `React` |
| **≥17 新运行时** | `"jsx": "react-jsx"` | `import { jsx as _jsx } from 'react/jsx-runtime'` |

本仓库 `packages/ts-config` 使用 `react-jsx`，所以 `.tsx` 里 **可以不写** `import React from 'react'`，但仍要 import 真正用到的 hook 和类型。

## 1.4 函数组件（今日默认）

**无状态函数组件 ≥0.14；带状态 ≥16.8 Hooks。**

```tsx
type Props = { title: string; children?: React.ReactNode };

export function Panel({ title, children }: Props) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

- 组件名必须 **大写开头**，否则 React 当成原生标签。
- 只能返回：一个根节点、数组、`null`、字符串/数字、Portal、Fragment。
- **不要在组件函数体里改 props**（只读）。

## 1.5 props 与 `children`

`props` 是父组件传入的参数。`children` 是写在标签中间的内容，本质也是一个 prop。

```tsx
<Panel title="简介">
  <p>任意子树</p>
</Panel>
```

常用模式：

- **默认值：** `function Avatar({ size = 40 }: { size?: number })`（函数组件 **≥19** 更推荐参数默认值，而不是 `defaultProps`）。
- **剩余属性下传：** `<button type="button" {...rest} />`，注意覆盖顺序。
- **`props.children` 不一定是数组**：一个子节点就是该节点本身；多个才是数组。要统一处理用 `React.Children.map`（谨慎，API 较老）或自己规范化。

## 1.6 条件渲染

```tsx
{isAdmin && <AdminBar />}
{status === 'error' ? <Error /> : <Content />}
{items.length > 0 ? <List items={items} /> : <Empty />}
```

不要用 `obj && <X />` 若 `obj` 可能是 `0`/`''`。需要占位时用 `null`：`return null` 表示「这块什么都不画」。

## 1.7 Fragment

**≥16.0** `<React.Fragment>`；**≥16.2** 短语法 `<>...</>`。

用来返回多兄弟节点且不增加 DOM 层。短语法 **不能** 加 `key`；列表里要用 `<Fragment key={id}>`。

## 1.8 `key`（列表调和）

`key` 不是给开发者看的，是给 **调和算法** 用来判断「这是同一项还是新项」。

- 同层兄弟间 **稳定且唯一**（相对该列表，不必全局唯一）。
- **不要用 index 当 key**，若列表会插入/删除/排序——会导致 state 错位（输入框串到另一行）。
- `key` 变了 = React 拆掉旧实例、挂新实例（state 清零、effect 重跑）。

`key` 也可以用在非列表：`key={tab}` 强制重置一块 UI 的状态。

## 1.9 渲染发生了什么

一次更新大致是：

1. 某处 `setState` / 父组件重渲染。
2. 组件函数再跑一遍，产出新元素树。
3. React 把新树和上次 Fiber 树 **diff**（同层、按 `type`+`key`）。
4. 算出最少 DOM 操作，在提交阶段改真实 DOM，并处理 ref、layout effect、passive effect。

**15：** 这个过程不可中断。  
**16 Fiber：** 可拆分成片。  
**18：** 可在高优先级更新到来时 **丢掉未完成的渲染** 重来（并发）。

## 1.10 Strict Mode

**≥16.3** 引入，之后不断加检查。开发环境下：

- **18+** 会故意 **挂载 → 卸载 → 再挂载** 一次，暴露「effect 没写 cleanup」的 bug。
- 不会影响生产包。

本仓库用 Vite，开发时看到 effect 跑两遍是预期，不是泄漏本身。

## 1.11 和「直接操作 DOM」的边界

React 管它渲染出来的节点。你仍可以：

- 用 ref 读 DOM（测量高度、focus）。
- 在 effect 里订阅外部系统，cleanup 里退订。

不要在 render 阶段 `document.querySelector` 去改 DOM，会和 React 提交阶段打架。
