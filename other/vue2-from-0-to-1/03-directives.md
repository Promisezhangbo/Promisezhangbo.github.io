# 3. 指令、列表、表单

**版本：≥2.0**；插槽新语法 **≥2.6**。

## 3.1 条件与展示

| 指令 | 含义 |
| --- | --- |
| `v-if` / `v-else-if` / `v-else` | 销毁/重建节点（带局部状态会丢） |
| `v-show` | 切 `display: none`，状态还在 |
| `v-once` | 只渲染一次 |
| `v-html` / `v-text` | 原始 HTML / 文本 |

`v-if` 和 `v-for` **不要写在同一元素**（2 会先 for 后 if，容易踩坑）。先包 `<template v-if>` 或 computed 过滤列表。

## 3.2 `v-for` 与 `key`

```vue
<li v-for="(item, index) in list" :key="item.id">{{ item.name }}</li>
```

也可 `v-for="(v, k) in obj"`。`key` 规则同 React：稳定 id，不要用 index 当会插入删除的列表的 key。

## 3.3 属性绑定 `v-bind` / `:`

```vue
<img :src="url" :alt="name">
<div v-bind="attrsObject"> <!-- 2.4+ 对象展开 -->
```

布尔特性：`:disabled="isOff"`。`class` / `style` 支持对象、数组写法：

```vue
<div :class="['a', { active: isOn }]" :style="{ color, fontSize: size + 'px' }"></div>
```

## 3.4 事件 `v-on` / `@`

```vue
<button @click="save">保存</button>
<button @click.prevent="onSubmit">提交</button>
<input @keyup.enter="go">
```

常用修饰符：`.stop` `.prevent` `.capture` `.self` `.once` `.passive`  
按键：`.enter` `.esc` `.tab` 以及 `.ctrl` `.exact`  
系统：`.native` 监听 **组件根元素原生事件**（3 删除，因为 3 里未声明的监听会落到根上/`inheritAttrs`）。

## 3.5 `v-model`

语法糖：默认 `:value` + `@input`。

```vue
<input v-model="text">
<input v-model.trim="text">
<input v-model.number="age">
<input type="checkbox" v-model="on">
<select v-model="city">...</select>
```

自定义组件（2.x 默认）：

```js
model: { prop: 'checked', event: 'change' }, // 可选，改约定
props: ['value'],
// this.$emit('input', newVal)
```

`.sync`（**≥2.3**）：`:foo.sync="x"` ≡ `:foo="x" @update:foo="x = $event"`。3 用 `v-model:foo`。

## 3.6 自定义指令

```js
directives: {
  focus: {
    inserted(el) { el.focus(); },
  },
}
```

钩子：`bind` `inserted` `update` `componentUpdated` `unbind`（3 改名为 `created`/`mounted`/`beforeUpdate`/`updated`/`unmounted` 等，不完全同名）。
