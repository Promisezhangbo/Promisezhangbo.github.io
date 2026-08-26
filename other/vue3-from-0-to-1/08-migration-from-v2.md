# 8. 从 Vue 2 迁到 Vue 3

官方有 [v3-migration.vuejs.org](https://v3-migration.vuejs.org/) 和 `vue-codemod`。这里列 **会让 2 代码跑不起来** 的点。

## 8.1 必改

| 2 | 3 |
| --- | --- |
| `new Vue({ render }).$mount` | `createApp(App).mount` |
| 全局 `Vue.use(Router)` | `app.use(router)` |
| 组件 **单根** | 可多根；注意 `$attrs` |
| `v-model` 自定义组件 `value`/`input` | `modelValue` / `update:modelValue` |
| `.sync` | `v-model:foo` |
| `.native` | 删掉；监听落到组件根 / 声明 `emits` |
| `$listeners` | 用 `$attrs`（含 `onXxx`） |
| `$on` `$off` `$once` | 删除；事件总线换 mitt/pinia |
| `filters` | 方法/computed |
| `destroyed` `beforeDestroy` | `unmounted` `beforeUnmount` |
| 自定义指令 `inserted`/`unbind` | `mounted`/`unmounted` 等新名字 |
| `Vue.set` `$set` | 直接赋值 |
| `slot`/`slot-scope` 旧属性 | `v-slot`（2.6 已能先改） |
| 函数式组件 `{ functional: true }` | 普通函数 `(props, { slots }) => ...` |
| `$children` | 删除；用 provide 或显式 ref |
| `v-if`+`v-for` 同节点 | 3 **明确禁止**（2 只是坑） |

## 8.2 构建与周边

- webpack + vue-loader 15 → 建议 Vite + plugin-vue  
- vue-router 3 → **4**  
- vuex 3 → Pinia 或 vuex 4  
- Element UI → Element Plus  

## 8.3 建议节奏

1. 先升 **2.7**，把 mixin 改 composable、槽改 `v-slot`、去掉 filters/事件总线。  
2. 再升 3：换入口、v-model、路由、UI 库。  
3. 新文件用 `<script setup>`，旧 Options 可以留，3 **允许混用**。

## 8.4 不必在升级当天做的

把所有 Options 改成 setup。行为对齐、依赖升完就能发版。Composition 是可读性重构，不是 3 的强制门槛。
