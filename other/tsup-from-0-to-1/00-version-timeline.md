# 0. tsup 版本与定位

tsup 没有「语言版本」那么戏剧，跟着 **esbuild** 走。

| 线 | 说明 |
| --- | --- |
| tsup 6/7 | 常用；Node 16+ |
| tsup 8 | 依赖更新、dts 仍多靠 Rollup 插件 |
| esbuild 0.19–0.25 | 真正转译/压缩的引擎 |
| **tsdown** | VoidZero 侧、给 Vite+ 的库打包；API 类似「下一代 tsup」，本仓库未用 |

## 它解决什么

手写 Rollup：resolve、commonjs、typescript、dts、双格式、external……十几行配置。tsup 默认：

```bash
tsup src/index.ts --format esm,cjs --dts --clean
```

适合：cli、utils 包、组件库（注意 CSS/SFC 要额外插件，复杂 UI 库未必够）。
