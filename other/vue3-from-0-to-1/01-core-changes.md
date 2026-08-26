# 1. 相对 Vue 2 的核心变化

**版本：≥3.0（2020-09）。** 模板指令大部分还在（`v-if` `v-for` `v-model` `@click`），变的是 **实例怎么创建、响应式怎么实现、组件怎么组织**。

## 1.1 `createApp`：不再污染全局 Vue

```js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(router);
app.component('MyBtn', MyBtn);
app.mount('#app');
```

每个 app **自己的** 组件/插件/mixin。微前端可以多个 app 并存，这是对 2 的 `Vue.use` 全局单例的修正。

卸载：`app.unmount()`。

## 1.2 多根节点

```vue
<template>
  <header />
  <main />
</template>
```

不必再包一层无意义的 `div`。`$el` 在多根时不指向单一节点（用 `ref` 或 `$el` 行为要小心）。

## 1.3 入口仍是 SFC

`.vue` = template + script + style。3 推荐：

```vue
<script setup>
import { ref } from 'vue';
const n = ref(0);
</script>

<template>
  <button @click="n++">{{ n }}</button>
</template>
```

Options API 照样能用 `export default { data() { ... } }`，和 2 几乎同款（钩子改名见迁移章）。

## 1.4 `h()` 与 JSX

`h` 从 `'vue'` 导入，不再当 `render` 的第一个参数传入（兼容仍能写 `render(h)` 但文档按 `import { h } from 'vue'`）。JSX 需 `@vitejs/plugin-vue-jsx`。

## 1.5 全局 API 变成应用 API

| 2 | 3 |
| --- | --- |
| `Vue.component` | `app.component` |
| `Vue.directive` | `app.directive` |
| `Vue.mixin` | `app.mixin`（更不鼓励） |
| `Vue.use` | `app.use` |
| `Vue.prototype.x` | `app.config.globalProperties.x` |
| `Vue.config` | `app.config` |

## 1.6 自定义指令钩子改名

对齐组件：`bind`→`beforeMount`/`mounted`，`unbind`→`unmounted` 等。见官方「自定义指令」页，抄 2 的 `inserted` 会静默失效。
