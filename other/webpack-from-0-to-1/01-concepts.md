# 1. 核心概念

webpack 把项目看成一张 **模块依赖图**：从 `entry` 出发，按 `import`/`require` 递归，用 **loader** 把非 JS 变成 JS，用 **plugin** 在构建生命周期里插一脚，最后吐出 `output` 资源。

## 1.1 和「打包器」家族

| 工具 | 典型场景 |
| --- | --- |
| webpack | SPA 应用、复杂 loader、联邦模块 |
| Rollup | 库（ESM 输出干净） |
| esbuild / Rolldown | 极快；Vite 开发/生产分别用过它们 |
| Vite | 开发不打包源码，生产再打包（8 起用 Rolldown） |

## 1.2 五个核心

**Entry** 入口。多页：`{ main: './a.js', admin: './b.js' }`。

**Output** `filename`、`path`、`publicPath`（CDN 前缀）。`[contenthash]` **≥4** 用于长缓存。

**Loader** 从右到左、从下到上：

```js
{ test: /\.css$/, use: ['style-loader', 'css-loader'] }
```

先 `css-loader` 解析 `@import`，再 `style-loader` 注入。TS：`ts-loader` 或 `babel-loader`。

**Plugin** 例：`HtmlWebpackPlugin`、`DefinePlugin`、`MiniCssExtractPlugin`。  
**Mode** **≥4**：`development` / `production`（压缩、无 eval 源码、`process.env.NODE_ENV`）。

## 1.3 模块类型

默认理解 JS。通过 loader 收 `.vue` `.png` `.css`。webpack 5 用 **Asset Modules** 替代 `file-loader`/`url-loader`：

```js
{ test: /\.png$/, type: 'asset/resource' } // ≥5
```

## 1.4 开发服务器

`webpack-dev-server`：内存里 serve、HMR。配置 `devServer.proxy` 转发 API。HMR 靠 `module.hot`，React 用 Fast Refresh 插件。

## 1.5 Tree shaking

依赖 **ESM** `import`/`export`。CJS `require` 很难摇。`sideEffects: false` 写在 package.json 告诉打包器 CSS 副作用文件别误删。
