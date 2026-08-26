# 8. Vue 2 生态

## 8.1 路由 Vue Router **3.x**

- `<router-view>` `<router-link>`
- `this.$router.push` / `this.$route.params`
- 导航守卫：`beforeEach`、组件内 `beforeRouteEnter`（没有 `this`，用 `next(vm => ...)`）
- 模式：`hash` / `history`（history 要服务器回退 `index.html`）

**4.x 是 Vue 3 用的**，API 改成 `createRouter`、`useRoute`，不能混在 2 里（除非特殊构建）。

## 8.2 状态 Vuex **3.x**

`state` / `getters` / `mutations`（同步）/ `actions`（异步）/ `modules`。  
组件：`mapState` `mapGetters` `mapActions`。mutation 必须同步，这是调试时间旅行的前提。

Vue 3 官方推荐 **Pinia**（Vuex 5 精神续作）。Vuex 4 可跑在 3 上，新项目不必上。

## 8.3 构建

- **vue-cli 4/5** + webpack：2 时代默认
- Vite 对 Vue 2 要用 `vite-plugin-vue2`，不是 `@vitejs/plugin-vue`（那是 3）

## 8.4 UI

Element UI、Vuetify 2、iView、Ant Design Vue 1.x 绑 Vue 2。升 3 要换 Element Plus / Vuetify 3 / antd-vue 3/4。

## 8.5 和 React 笔记、本仓库

本 monorepo 是 **React 19**，没有 Vue 运行时。这两份 Vue 笔记只放在 `other/` 作学习/读老项目用。对照 React：[reactjs-from-0-to-1](../reactjs-from-0-to-1/README.md)。
