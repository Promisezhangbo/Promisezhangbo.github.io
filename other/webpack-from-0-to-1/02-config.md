# 2. 配置与拆包

## 2.1 最小 `webpack.config.js`

```js
const path = require('path');
module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash:8].js',
    clean: true, // ≥5.20 内置，替代 clean-webpack-plugin
  },
};
```

TS 配置可用 `webpack.config.ts`（要额外 ts-node/tsx）。

## 2.2 拆包 `splitChunks` ≥4

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: { test: /node_modules/, name: 'vendor', chunks: 'all' },
    },
  },
  runtimeChunk: 'single',
}
```

动态 `import('./page.js')` 产生异步 chunk（路由懒加载）。

## 2.3 Module Federation ≥5

多个独立构建的应用运行时共享模块（微前端一种）。配置 `plugins: [new ModuleFederationPlugin({ name, remotes, exposes, shared })]`。本仓库微前端用的是 **qiankun**，不是联邦。

## 2.4 持久缓存 ≥5

```js
cache: { type: 'filesystem' }
```

二次构建明显加快。

## 2.5 常见坑

- `publicPath` 错导致 chunk 404。
- 5 去掉 Node polyfill，老库要 `fallback`。
- loader 顺序反了 CSS 不生效。
- 多份 React：`resolve.alias` 或 `shared` 单例。
- sourcemap：`devtool: 'eval-source-map'` 开发；生产 `hidden-source-map` 或关。

## 2.6 什么时候还用 webpack

已经有很重的自定义 loader、联邦、或公司脚手架锁死。新 SPA **优先 Vite**。库优先 Rollup/tsup/tsdown。
