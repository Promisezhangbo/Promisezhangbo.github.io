# 8. 生态与本仓库对照

React 本身不管路由、请求、构建。下面是从 0 到能干活需要认识的周边，以及 **这个 monorepo 已经选好的答案**。

## 8.1 构建

| 工具 | 大致年代 | 说明 |
| --- | --- | --- |
| webpack + CRA | 2016–2021 主流 | `react-scripts` 已冻结 |
| **Vite** | 2020 起 | 开发 ESM 直出，生产 Rollup/Rolldown |
| Next.js | 框架 | 路由 + SSR/RSC，绑死 React 版本 |

本仓库：根 **Vite 8** + `@vitejs/plugin-react`，子应用 `vite-plugin-qiankun`。JSX 为 **`react-jsx`（≥17 运行时）**。

## 8.2 路由

| 库 | 版本记忆点 |
| --- | --- |
| react-router v5 | `<Switch>` `<Route exact>`、class 时代 HOC `withRouter` |
| v6 | **2021-11** `<Routes>`、嵌套路由、`useNavigate`、相对路径 |
| **v7** | 与 Remix 合并后的数据 API；可当库用 |

本仓库：`react-router-dom@^7`。学的时候按 **v6/v7 的 `Routes`/`Route`/`useParams`** 即可，不要背 v5。

微前端：主应用 qiankun 根据 URL 挂载子应用，子应用内部再自己用 Router。basename 要和 `micro-apps.registry.json` 的路径前缀一致。

## 8.3 状态管理

| 方案 | 何时 |
| --- | --- |
| 组件 state + 提升 | 默认 |
| Context | 低频全局（主题、登录态） |
| Redux | **2015** 起；**Redux Toolkit ≥2019** 才是现代写法 |
| Zustand / Jotai / Valtio | 更轻的 2020 后选择 |
| TanStack Query（React Query） | **服务端缓存**，不是替代 UI state |
| `useSyncExternalStore` | **≥18**，给外部 store 用 |

本仓库业务页多数是局部 state + OpenAPI SDK 请求，没有上全局 Redux。

## 8.4 TypeScript

- `@types/react` / `@types/react-dom` 大版本跟 React 走（这里是 **19**）。
- `React.FC` 不必强求；直接 `function C(props: Props)` 更清晰。
- `ReactNode`、`ComponentProps<'button'>`、`CSSProperties` 常用。
- **19** 的 `ref` 类型在 DOM 组件和自定义组件上更统一。

## 8.5 测试与质量

- 渲染测试：**React Testing Library**（按用户行为，不测实现细节）。
- 不要新开 `enzyme`（跟 class / 16 绑定，已停滞）。
- Hooks 规则：`eslint-plugin-react-hooks`；本仓库 **Oxlint**。

## 8.6 UI 库

Antd、MUI、Chakra 等都是「组件实现」，仍遵守 React 的 props/state。注意它们声明的 **peer `react` 范围**。

本仓库：**antd 6** + `@ant-design/icons`，要求 React 19。

## 8.7 推荐动手顺序（对照本仓库）

1. 在 `apps/utils` 或任意子应用加一个函数组件页面：`useState` 表单。
2. 用 `useEffect` 调一次 `@packages/openapi` 生成的接口，注意 abort/过期响应。
3. 用 `react-router-dom` 加一条嵌套路由。
4. 读 `apps/login` 的 `I18nProvider` + `useT`，体会 Context。
5. 需要弹层时用 Antd Modal（Portal），不要自己 `appendChild` 除非必要。
6. 列表卡了再看 `memo` / 分页，而不是先上 Redux。

## 8.8 官方学习材料

- 教程：[react.dev/learn](https://react.dev/learn)（按最新 19 写）
- API：[react.dev/reference/react](https://react.dev/reference/react)
- 升级：18 [react.dev/blog/2022/03/08/react-18-upgrade-guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)；19 [react.dev/blog/2024/04/25/react-19-upgrade-guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- 本目录：[README.md](./README.md)
