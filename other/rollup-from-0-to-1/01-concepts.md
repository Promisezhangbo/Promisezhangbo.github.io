# 1. 概念、配置、插件

## 1.1 和 webpack 差在哪

Rollup 默认按 **ES 模块静态结构** 把文件拼成少数几个 chunk，删除没用到的 `export`（tree shake）。它 **不内置** 一套 css-loader 帝国；应用级资源、HMR、dev server 要自己叠或交给 Vite。

适合：npm 包、要 `esm`+`cjs` 双产物。不太适合：随便 `require` 图片、HTML 模板的老应用（也能做，插件会很多，此时 webpack/Vite 更合适）。

## 1.2 最小配置

```js
// rollup.config.mjs
export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/index.js', format: 'esm', sourcemap: true },
    { file: 'dist/index.cjs', format: 'cjs' },
  ],
  external: ['react', 'react-dom'], // 不要打进包
  plugins: [],
};
```

`format`：`esm` | `cjs` | `iife` | `umd`。库用前两个；直接丢 `<script>` 用 iife/umd。

## 1.3 插件钩子（读 Vite 插件也够用）

顺序概念：

1. `options` / `buildStart`
2. `resolveId`：别人 `import 'foo'` 时你告诉它文件路径
3. `load`：读文件
4. `transform`：改代码（JSX、TS、CSS-in-JS）
5. `generateBundle` / `writeBundle`

同一个钩子多个插件按数组顺序。Vite 的 `enforce: 'pre'` 就是插到更前面。

官方常用：`@rollup/plugin-typescript`、`node-resolve`、`commonjs`（把 CJS 依赖转 ESM 才能 shake）。

## 1.4 `external` 与 `globals`

库不要把 React 打进去。`peerDependencies` 列谁，`external` 就排除谁。UMD 还要 `output.globals: { react: 'React' }`。

## 1.5 代码分割

`output.dir` + 动态 `import()` → 多个 chunk。`manualChunks` 在 Rollup 2+ / 输出 `output` 里可配函数。Vite 的 `manualChunks` 就是透传这里（8 则透传到 Rolldown）。

## 1.6 常见坑

- 漏 `node-resolve`：找不到 `lodash`。
- 漏 `commonjs`：CJS 依赖打出来是空对象。
- 副作用：包的 `sideEffects` 标错导致 CSS 被摇没。
- 默认 treeshake 太激进：`treeshake: { moduleSideEffects: true }` 调试。
