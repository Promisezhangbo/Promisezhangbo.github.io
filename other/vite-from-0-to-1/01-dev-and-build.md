# 1. 开发与生产

## 1.1 开发：不打包应用源码

`vite` 启动后：

1. 浏览器请求 `/src/main.tsx`，Vite 按 ESM 转成浏览器能执行的模块。
2. `node_modules` 里的依赖预构建成少量 ESM 文件（**2–7：esbuild；8：Rolldown**），避免千个文件的瀑布请求。
3. 改源码：只让变过的模块失效，**HMR**，不必重打整包。

所以冷启动比 webpack 快一个数量级（大项目更明显）。

## 1.2 生产：还是要打包

浏览器不能直接上线几千个源文件（HTTP/2 也扛不住瀑布 + 体积）。`vite build`：

- **2–7：** Rollup 打应用包，esbuild 压缩
- **8：** Rolldown 一条链打完（更快，和开发更同构）

产物：`dist/` 里带 hash 的 JS/CSS。`base` 决定资源前缀（本仓库生产 `/main/` 等）。

## 1.3 为什么还要懂 Rollup/Rolldown

`build.rolldownOptions.output.manualChunks` 就是在配打包器。插件的 `transform`/`resolveId` 来自 Rollup 插件模型。

## 1.4 SSR / Library 模式

- `build.ssr`：打 Node 用的包。
- `build.lib`：库模式（单入口、external react）。库也常用 tsup/tsdown，不一定 Vite。

## 1.5 环境变量

- `import.meta.env.VITE_*`：只有 `VITE_` 前缀暴露给客户端。
- `loadEnv(mode, envDir)`：`.env.production`。
- `import.meta.env.DEV` / `PROD` / `MODE`。

不要把密钥放进 `VITE_`。本仓库部署标签用 `define` 注入。
