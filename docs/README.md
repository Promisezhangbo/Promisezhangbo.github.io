# 文档索引

本目录为 Monorepo **设计与运维** 说明；各 `packages/*/README.md` 为对应包的速查入口。

## 前端与微前端

| 文档 | 说明 |
| --- | --- |
| [local-dev-whistle-qiankun.md](./local-dev-whistle-qiankun.md) | 本地 Whistle + 主应用 Vite 代理联调线上域名；端口与 `microAppsDev` 约定 |
| [responsive-mobile.md](./responsive-mobile.md) | 移动端 / 窄屏响应式：style-config 断点、主壳 Drawer、各子应用约定 |
| [i18n.md](./i18n.md) | 多语言（`@packages/i18n`）：全站 `private_locale`、各应用接入状态、页面迁移清单 |
| [seo.md](./seo.md) | SEO（`@packages/seo`）：`applyDocumentSeo`、各应用预设与 qiankun 下的 `document` 行为 |
| [google-search-console.md](./google-search-console.md) | Google Search Console：DNS / HTML 验证说明（DNS 在域名服务商配置） |
| [turbo.md](./turbo.md) | Turborepo 任务、缓存、`filter`、与 OpenAPI 生成的依赖关系 |

## 部署

| 文档 | 说明 |
| --- | --- |
| [github-pages-deploy.md](./github-pages-deploy.md) | GitHub Pages 手动部署、`dist/` 与 `postbuild` |
| [netlify-deploy.md](./netlify-deploy.md) | Netlify 部署约定 |
| [tencent-cvm-docker.md](./tencent-cvm-docker.md) | 整站 Docker 镜像 → 腾讯云 CVM / 轻量（TCR + `Dockerfile.cvm`） |

## 后端

| 文档 | 说明 |
| --- | --- |
| [../backend/README.md](../backend/README.md) | 后端目录说明 |
| [../backend/api-server/README.md](../backend/api-server/README.md) | Deno api-server：命令、环境变量、SQL 迁移与 Deploy |

## 共享包速查（`packages/`）

| 包 | README | 职责 |
| --- | --- | --- |
| `@packages/i18n` | [packages/i18n/README.md](../packages/i18n/README.md) | i18next 多语言（zh-CN / en） |
| `@packages/seo` | —（详见 [seo.md](./seo.md)） | 运行时 `document` SEO |
| `@packages/openapi` | [packages/openapi/README.md](../packages/openapi/README.md) | OpenAPI 生成与 SDK |
| `@packages/micro-app-cli` | [packages/micro-app-cli/README.md](../packages/micro-app-cli/README.md) | 子应用 create / remove / sync |
| `@packages/style-config` | [packages/style-config/README.md](../packages/style-config/README.md) | 公共 SCSS 变量与主题 |
| `@packages/ts-config` | [packages/ts-config/README.md](../packages/ts-config/README.md) | TS 基础配置 |

## 当前应用一览（`apps/`）

| 应用 | 类型 | 开发端口 | 路径前缀 |
| --- | --- | --- | --- |
| main | 基座 | 9000 | `/`（dev）/ `/main/`（prod） |
| agent | 子应用 | 9001 | `/agent/` |
| blog | 子应用 | 9002 | `/blog/` |
| login | 子应用 | 9003 | `/login/` |
| skill | 子应用 | 9004 | `/skill/` |
| resume | 子应用 | 9005 | `/resume/` |
| utils | 子应用 | 9006 | `/utils/` |

端口与菜单以 **`packages/micro-app-cli/micro-apps.registry.json`** 为准；改 registry 后执行 `pnpm micro-app:sync`。自动生成文件见 `apps/main/src/utils/microAppsDev.ts`。

## 横切能力现状（速览）

| 能力 | 基础设施 | 业务层完成度 |
| --- | --- | --- |
| 多语言 | 全部 7 个 `apps/*` 已挂 `I18nProvider` + `AntdLocaleProvider` | 仅 **login** 页面文案与 SEO 已 `useT`；其余命名空间为空占位 |
| SEO | 各应用 `index.html` + `main.tsx` 预设；主应用 `/home` 写 main 预设 | 仅 **login** 随语言切换 SEO（`LoginSeoSync`） |
| 微前端 | qiankun + `vite-plugin-qiankun`；开发代理见 `microAppsDev` | — |

根目录 [README.md](../README.md) 含环境要求、常用脚本与仓库结构。
