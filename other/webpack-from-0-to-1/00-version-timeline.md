# 0. webpack 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 1.x | 2012–2016 | CommonJS 打包、loader 雏形 |
| 2 / 3 | 2016–2017 | Tree shaking 起步、`import()` |
| **4.0** | 2018-02 | `mode`、`splitChunks` 取代 CommonsChunk、零配也能跑 |
| **5.0** | 2020-10 | **持久缓存**、Module Federation、更好的 tree shaking、WASM、不再内置 Node polyfill |
| 5.x 长期 | 2020–今 | 仍是 CRA、大量后台管理系统的基线 |
| 6 | 规划中 | 未作为本笔记默认 |

Node polyfill：4 会自动填 `Buffer`/`process`；**5 去掉**，要自己 `resolve.fallback`。

## 生态版本

| 包 | 对齐 |
| --- | --- |
| `webpack-cli` | 4/5 搭配 webpack 5 |
| `webpack-dev-server` | 4.x 配 webpack 5 |
| `html-webpack-plugin` | 5.x |
| `babel-loader` / `ts-loader` / `css-loader` | 跟 webpack 5 |
| `mini-css-extract-plugin` | 生产抽 CSS |
| Module Federation | **≥5.0** 内置 |

Vue CLI / CRA 底层都是 webpack 4/5；它们冻结后新项目转向 Vite。
