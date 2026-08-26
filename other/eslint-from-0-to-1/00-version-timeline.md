# 0. ESLint 版本时间线

| 版本 | 时间 | 一句话 |
| --- | --- | --- |
| 1–3 | 2013–2016 | 取代 JSHint；可插拔规则 |
| 4–6 | 2017–2019 | 范围收紧、`eslint:recommended` 进化 |
| **7** | 2020 | 可选链等语法、报告格式 |
| **8** | 2021 | `eslintrc` 成熟期；**2024-10 EOL** |
| **9.0** | 2024-04 | **默认 Flat Config**（`eslint.config.js`）；eslintrc 要兼容包才读 |

## 配套版本必须对齐

| 包 | 对齐 |
| --- | --- |
| `eslint` 8 | `.eslintrc.*`；`eslint-plugin-react` 老文档 |
| `eslint` 9 | `eslint.config.js`；**typescript-eslint v8** |
| `eslint-plugin-react-hooks` | 跟 React 版本；19.2 要新到认识 `useEffectEvent` |
| `@eslint/js` | 9 的官方推荐集 |
| `eslint-config-prettier` | 关掉和 Prettier 冲突的格式规则 |

Oxlint 的规则 id 大量 **抄 ESLint 社区命名**（`no-unused-vars`），所以先懂 ESLint 再看 Ox 文档会快很多。
