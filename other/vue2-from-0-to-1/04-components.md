# 4. 组件通信

## 4.1 注册

- 全局：`Vue.component('my-btn', { ... })`（全应用可见，微前端危险）
- 局部：`components: { MyBtn }`
- 模板里用 **kebab-case** `<my-btn>`；组件名 PascalCase 在 SFC 也可。

递归组件要设 `name`。异步：`() => import('./Big.vue')`（vue-router 懒加载同理）。

## 4.2 props

```js
props: {
  title: { type: String, required: true },
  size: { type: Number, default: 16 },
  list: { type: Array, default: () => [] }, // 引用类型 default 必须函数
}
```

单向：子 **不要**改 prop。改了 2 会警告。要改副本：`data() { return { inner: this.title }; }` 再 watch prop。

`prop` 在模板自动可用；JS 里 `this.title`（定义是 `title` 不是 `Title`）。

非 prop 特性默认掉到 **根元素** 上（`inheritAttrs: false` + `$attrs` 可自己绑）。

## 4.3 事件 `$emit`

```js
this.$emit('change', payload);
// 模板
<Child @change="onChange" />
```

2.x **没有** 必须声明的 `emits` 选项（那是 3）。文档里写一下约定即可。`.sync` 约定事件名 `update:foo`。

## 4.4 插槽

默认槽：父写在标签中间，子 `<slot>兜底</slot>`。

具名：**≥2.0** `slot="footer"`（旧）；**≥2.6**

```vue
<!-- 父 -->
<Card>
  <template v-slot:header>标题</template>
  <template #default>正文</template>
</Card>
<!-- 子 -->
<header><slot name="header" /></header>
<slot />
```

作用域槽：子把数据传给父的槽函数。

```vue
<!-- 子 -->
<slot :row="item" />
<!-- 父 ≥2.6 -->
<template #default="{ row }">{{ row.name }}</template>
<!-- 旧 ≥2.1 -->
<template slot-scope="{ row }">
```

**2.6** 起普通槽也是函数，`$scopedSlots` 与 `$slots` 逐渐统一。

## 4.5 `provide` / `inject` ≥2.2

跨多层传依赖（主题、i18n）。**2.x 默认不是响应式的**：provide 一个字符串/数字，后面改了子收不到。要响应：provide `this` 上的对象（且对象本身是 data/observable），子 inject 后读对象字段。

3 里 provide 的 `ref`/`reactive` 默认就能跟。

## 4.6 `$refs` / `$parent`

`ref="input"` → `this.$refs.input`（组件则是子实例）。`v-for` 的 ref 是数组。挂载前是 `undefined`，改完 data 要 `$nextTick`。

能 props/emit 就不要 `$parent.$emit` 这种暗线。
