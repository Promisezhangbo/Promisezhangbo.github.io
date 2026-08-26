# 7. Vue 3 生态

## 7.1 构建：Vite

`npm create vue@latest`（官方 `create-vue`）= Vite + `@vitejs/plugin-vue`。开发 ESM，生产打包。vue-cli 对 3 已不作为新项目推荐。

本仓库是 Vite + React，插件换成 `@vitejs/plugin-react`，同一类工具链。

## 7.2 Vue Router **4**

```js
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/p/:id', component: Page, props: true }],
});
```

组件内：`useRouter()` `useRoute()`（**≥4，组合式**）。  
`router-view` 的 v-slot 拿组件做 keep-alive。导航守卫仍在，`beforeRouteEnter` 没有实例的问题还在。

不能和 Vue 2 的 router 3 混用。

## 7.3 Pinia（官方推荐状态库）

替代 Vuex。没有 mutations，action 可同步可异步，TS 友好。

```js
export const useUser = defineStore('user', () => {
  const name = ref('');
  function setName(v) { name.value = v; }
  return { name, setName };
});
```

组件 `const user = useUser()`。Vuex 4 能跑 3，新项目用 Pinia。

## 7.4 UI

Element Plus、Vuetify 3、Naive UI、Ant Design Vue 4 — 认准 **peer vue@3**。

## 7.5 测试

Vue Test Utils 2 + Vitest。Testing Library 有 Vue 版。别用 VTU 1（Vue 2）。

## 7.6 和 React 对照（记概念）

| Vue 3 | React 19 |
| --- | --- |
| `ref` + 模板自动解包 | `useState` |
| `computed` | 渲染期直接算或 `useMemo` |
| `watch` / `watchEffect` | `useEffect` |
| `onMounted` | `useEffect([],)` |
| composable `useXxx` | 自定义 Hook |
| `Teleport` | `createPortal` |
| `defineModel` | 受控 `value`+`onChange` |
| Pinia | Zustand / Redux |
| SFC 模板 | JSX |

Vue 默认细粒度更新；React 默认函数重跑再 diff。两边都能写出烂性能，模型不同。
