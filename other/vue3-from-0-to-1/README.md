# Vue 3 从 0 到 1

面向新项目和从 2 升级。默认按 **Composition API + `<script setup>`** 写；Options API 在 3 里 **仍然正式支持**，不是废弃。

当前主线：**3.5.x**（2024-09 起，之后多为补丁）。文档：[vuejs.org](https://vuejs.org/) / [cn.vuejs.org](https://cn.vuejs.org/)。

本仓库前端是 React，Vue 笔记只在 `other/` 学习用。Vue 2 对照：[vue2-from-0-to-1](../vue2-from-0-to-1/README.md)。

## 怎么读

| 顺序 | 文档 | 内容 | 版本 |
| --- | --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 3.0 → 3.5 特性表 | 查阅 |
| 1 | [相对 Vue 2 的核心变化](./01-core-changes.md) | createApp、多根、Teleport | **≥3.0** |
| 2 | [Proxy 响应式](./02-reactivity.md) | ref / reactive / computed / 不再需要 `$set` | **≥3.0** |
| 3 | [Composition API](./03-composition-api.md) | setup、生命周期、watch、composables | **≥3.0** |
| 4 | [`<script setup>`](./04-script-setup.md) | 宏、defineProps/Emits | **≥3.2 推荐写法** |
| 5 | [组件、插槽、内置](./05-components.md) | v-model 参数、Teleport、Suspense、Fragment | **≥3.0** |
| 6 | [3.3–3.5](./06-vue-3-3-to-3-5.md) | defineModel、useTemplateRef、props 解构 | **≥3.3 / 3.4 / 3.5** |
| 7 | [生态](./07-ecosystem.md) | Vite、Router 4、Pinia | 实践 |
| 8 | [从 2 迁移](./08-migration-from-v2.md) | 破坏性变更清单 | 升级 |

最短路径（新项目，按 3.5）：`createApp` → `ref`/`computed` → `<script setup>` + `defineProps` → `v-model` / 插槽 → 需要双向再 `defineModel`（≥3.4）。
