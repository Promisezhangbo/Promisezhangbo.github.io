# Vue 2 从 0 到 1

面向「会 JS，要读懂 / 维护 Vue 2 项目」的笔记。Vue 2 已于 **2023-12-31 EOL**，新项目应学 [Vue 3](../vue3-from-0-to-1/README.md)；大量存量代码仍是 2.x + Options API。

官方归档文档：[v2.vuejs.org](https://v2.vuejs.org/)（中文常镜像在 [cn.vuejs.org](https://v2.cn.vuejs.org/)）。

## 怎么读

| 顺序 | 文档 | 内容 | 版本基线 |
| --- | --- | --- | --- |
| 0 | [版本时间线](./00-version-timeline.md) | 2.0 → 2.7、和 3 的对照、EOL | 查阅 |
| 1 | [核心思想与模板](./01-core-ideas.md) | 实例、SFC、声明式渲染 | **≥2.0** |
| 2 | [Options API](./02-options-api.md) | data / computed / watch / methods | **≥2.0** |
| 3 | [指令与列表表单](./03-directives.md) | v-if / v-for / v-model / 事件修饰符 | **≥2.0**；`v-slot` **≥2.6** |
| 4 | [组件通信](./04-components.md) | props、`$emit`、slot、`.sync`、provide/inject | inject **≥2.2**；scoped slot **≥2.1/2.6** |
| 5 | [响应式原理与陷阱](./05-reactivity.md) | `defineProperty`、`Vue.set`、数组 | **2.x 特有，3 已消失** |
| 6 | [生命周期与混入](./06-lifecycle-mixins.md) | 钩子、mixin、keep-alive | **≥2.0** |
| 7 | [2.7 与收官](./07-vue-2-7.md) | 回移植的 Composition API、`script setup` | **≥2.7（2022-07）** |
| 8 | [生态](./08-ecosystem.md) | Vue Router 3、Vuex 3、vue-cli | 实践 |

版本标记：`≥2.6` 表示该小版本起可用。2.7 虽能写 Composition API，响应式仍是 **getter/setter**，和 Vue 3 的 Proxy **不是一回事**。
