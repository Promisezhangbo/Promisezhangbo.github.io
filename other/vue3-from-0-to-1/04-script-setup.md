# 4. `<script setup>`

**3.0 实验，≥3.2（2021-08）稳定并成为官方推荐。** 编译期语法糖：顶层变量/函数/import **自动进模板**，不必 `return`。

## 4.1 最小例子

```vue
<script setup>
import { ref } from 'vue';
import Foo from './Foo.vue';
const n = ref(0);
</script>

<template>
  <Foo />
  <button @click="n++">{{ n }}</button>
</template>
```

组件在模板里可直接用。`Foo` 不必再写进 `components: {}`。

## 4.2 宏（编译器注入，不必从 vue import）

| 宏 | 版本 | 作用 |
| --- | --- | --- |
| `defineProps()` | ≥3.0/3.2 | 声明 props |
| `defineEmits()` | ≥3.0/3.2 | 声明事件 |
| `defineExpose()` | ≥3.2 | 暴露给父 ref（默认 setup 是关闭的） |
| `defineOptions()` | **≥3.3** | `name`、`inheritAttrs` 等 |
| `defineSlots()` | **≥3.3** | 仅类型，插槽 TS |
| `defineModel()` | **≥3.4 稳定** | `v-model` 双向 |

```vue
<script setup lang="ts">
const props = defineProps<{ title: string; size?: number }>();
const emit = defineEmits<{ save: [id: string] }>();
defineExpose({ focus });
</script>
```

运行时写法：`defineProps({ title: String })`。  
**≥3.3** 可用 **导入的类型** 做 props 接口（以前只能文件内字面量类型）。

## 4.3 和普通 `<script>` 并存

需要 `name`（3.3 前）或本地非 setup 逻辑时，再写一块 **不带 setup** 的 `<script>`。3.3+ 多数用 `defineOptions({ name: 'Comp' })`。

## 4.4 顶层 `await`

```vue
<script setup>
const data = await fetch('/api').then((r) => r.json());
</script>
```

组件变成 **异步组件**，父级要用 `<Suspense>`。仅 Vue 3（**2.7 没有**）。

## 4.5 `useSlots` / `useAttrs`

setup 里没有第二个参数时，用这两个函数读 slots/attrs。

## 4.6 CSS `v-bind`

```vue
<script setup>
const color = ref('red');
</script>
<style scoped>
.el { color: v-bind(color); }
</style>
```

**≥3.2**（2.7 也有）。值是 JS 表达式，编译成 CSS 变量。
