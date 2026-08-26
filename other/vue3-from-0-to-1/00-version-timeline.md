# 0. Vue 3 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| **3.0** | 2020-09 | Proxy、Composition API、Fragment、Teleport、Suspense、`createApp`、`emits` |
| 3.1 | 2021 | 内部/IE 相关收尾（IE 最终放弃） |
| **3.2** | 2021-08 | **`<script setup>` 稳定推荐**、`v-memo`、`effectScope`、`defineCustomElement`、SFC CSS 增强 |
| **3.3** | 2023-05 | `defineOptions` `defineSlots`、导入类型用于 props、泛型组件 |
| **3.4** | 2023-12 | **`defineModel` 稳定**、同名属性简写、解析器重写 |
| **3.5** | 2024-09 | **响应式 props 解构稳定**、`useTemplateRef` `useId` `onWatcherCleanup`、响应式/SSR 性能 |
| 3.5.x 补丁 | 2025–2026 | 修复与小改进，心智不变 |

Vue 2 **EOL 2023-12-31**。3 是默认 `npm` 上的 `vue`。

## API 引入对照

| 知识点 | 版本 |
| --- | --- |
| `createApp` / 应用作用域插件 | **≥3.0** |
| `ref` `reactive` `computed` `watch` `watchEffect` | **≥3.0** |
| `setup()` | **≥3.0** |
| 多根节点 Fragment | **≥3.0** |
| `Teleport` | **≥3.0** |
| `Suspense`（异步组件/async setup） | **≥3.0**（实验色彩随文档，生产要会 fallback） |
| 多个 `v-model:foo` | **≥3.0** |
| `emits` 选项 | **≥3.0** |
| `<script setup>` | 3.0 实验，**≥3.2 稳定主推** |
| `defineProps` `defineEmits` `defineExpose` | **≥3.0/3.2** 宏 |
| `v-memo` | **≥3.2** |
| `effectScope` | **≥3.2** |
| `defineOptions` `defineSlots` | **≥3.3** |
| `defineModel` | 3.3 实验，**≥3.4 稳定** |
| 模板同名简写 `:id` 同 `id` 变量 | **≥3.4** |
| 解构 props 保持响应 | **≥3.5 稳定**（3.3/3.4 有过实验开关） |
| `useTemplateRef` `useId` `onWatcherCleanup` | **≥3.5** |

## 刻意不在 3 里的 2 API

`filters`、实例 `$on/$off/$once`、`.native`、`.sync`、`$listeners`（并入 `$attrs`）、`Vue.set`、`$children` 等。见 [08 迁移](./08-migration-from-v2.md)。
