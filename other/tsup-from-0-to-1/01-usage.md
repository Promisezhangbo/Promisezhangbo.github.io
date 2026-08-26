# 1. 用法与边界

## 1.1 配置 `tsup.config.ts`

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  target: 'es2022',
});
```

`package.json`：

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## 1.2 重要行为

- **JS 转译 = esbuild**：快，但 **不跑 `tsc` 全量类型检查**。发版仍要 `tsc --noEmit`。
- **`dts: true`**：通常用 rollup-plugin-dts 把声明搓到一起；复杂 re-export 可能坏，改 `dts: { compilerOptions }` 或单独 `tsc --emitDeclarationOnly`。
- `banner` / `esbuildOptions` 可塞进底层。
- `watch` 开发库。

## 1.3 别用 tsup 的时候

- 要 Vite 插件、HTML、HMR → Vite
- 要完整 Rollup 插件宇宙、很怪的输出 → 手写 Rollup
- 已经 Vite 8 应用 → 不必再套 tsup
- 新 VoidZero 工具链 → 看 tsdown / `vp pack`

## 1.4 和本仓库

`packages/*` 目前是源码直接给 Vite 解析（workspace），**没有** tsup 发 npm 的流程。若以后抽独立包再考虑。
