# 0. Vue 2 版本时间线

## 大版本

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 1.x | 2015 | 早期；和 2 不兼容，可忽略 |
| **2.0** | 2016-09 | Virtual DOM、组件系统定型，今日「Vue 2」的起点 |
| 2.1 | 2016 | scoped slot 初版（`slot-scope`） |
| 2.2 | 2017 | `provide` / `inject`（默认**非响应**） |
| 2.5 | 2017-10 | TS 改善、`errorCaptured` |
| **2.6** | 2019-02 | 槽统一为 `v-slot`、`Vue.observable`、性能 |
| **2.7** | 2022-07 | 从 3 **回移植** Composition API、`<script setup>`、CSS `v-bind` |
| EOL | **2023-12-31** | 官方不再发功能/常规修复；安全补丁视情况 |

2.x 最后一条维护线是 **2.7**。新特性不会再加。

## 按主题：API 从哪一版开始

| 知识点 | 版本 | 说明 |
| --- | --- | --- |
| Options API（data/computed/watch/methods） | **≥2.0** | 2 的默认写法 |
| 单文件组件 `.vue` | **≥2.0** + vue-loader | template + script + style |
| `v-model` 组件默认 `value` + `input` | **2.x** | 3 改成 `modelValue` + `update:modelValue` |
| `.sync` | **≥2.3** | 3 删除，改用 `v-model:xxx` |
| 过滤器 `filters` | **2.x** | **3 删除** |
| `$on` / `$off` / `$once`（实例事件） | **2.x** | **3 删除**（不能当事件总线） |
| `$listeners` | **2.x** | 3 并进 `$attrs` |
| `slot-scope` | **≥2.1** | **2.6** 起用 `v-slot`，旧语法仍能跑 |
| `v-slot` / `#default` | **≥2.6** | |
| `provide` / `inject` | **≥2.2** | 2.x 默认不响应；要响应需传 `Vue.observable` 或 `data` 里的对象 |
| `Vue.set` / `this.$set` | **2.x** | 3 不需要（Proxy） |
| `Vue.observable` | **≥2.6** | 3 用 `reactive` |
| `errorCaptured` | **≥2.5** | |
| Composition API / `<script setup>` | **≥2.7** 内置；更早用 `@vue/composition-api` 插件 | 无 `createApp`、无顶层 await |
| CSS `v-bind()` | **≥2.7** | |

## 2 → 3 时会消失的东西（读迁移用）

| 2.x | 3.x |
| --- | --- |
| `new Vue()` | `createApp()` |
| `Vue.component` 全局污染 | `app.component` 有应用作用域 |
| `filters` | 用方法 / computed |
| `$on/$off` 事件总线 | 外部库（mitt）或 provide |
| `.native` 修饰符 | 不再需要（监听原生事件直接写） |
| `.sync` | `v-model:foo` |
| `$listeners` | 并入 `$attrs` |
| 函数式组件对象形态 | 普通函数组件 |
| 必须单根节点 | Fragment 多根 |

完整迁移笔记见 [Vue 3 目录](../vue3-from-0-to-1/08-migration-from-v2.md)。
