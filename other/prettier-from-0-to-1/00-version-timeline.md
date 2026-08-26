# 0. Prettier 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 1.x | 2017 | 爆红；少配置 |
| **2.0** | 2020 | `--end-of-line`、更好的 TS |
| **3.0** | 2023-07 | **纯 ESM**、默认 `trailingComma: "all"`、插件 API 不兼容 2 |

3 的破坏：

- `require('prettier')` 在 CJS 里要小心；配置可用 `prettier.config.cjs` 或 `"type":"module"` 的 `.js`
- 旧插件（2.x）可能挂，需升到 3 兼容版
- 默认尾逗号 all（含函数参数）

## 配置文件名

`.prettierrc` / `.prettierrc.json` / `prettier.config.mjs` / `package.json` 的 `"prettier"` 字段。
