var e=`---
title: 我是如何带领团队从零到一建立前端规范的？
summary: 从为什么需要规范、如何落地到 Prettier、husky、commitlint 与 UI 规范协同的实践记录。
source: https://juejin.cn/post/7085257325165936648
category: arch
---

## 前言

不以规矩，不能成方圆。统一规范能提高可读性、可维护性与协作效率；缺乏规范则容易产生「只有某人敢改」的代码与无休止的 Code Review 争论。

## 为什么依然难落地

短期交付压力、个人习惯差异、会上达成一致会下照旧等，都会让规范流于形式。更有效的方式是：**文档化最佳实践**、**按优先级小步纳入迭代**、**Review 中严格执行**，并鼓励质疑不适用的规则。

## 开发流程建议

接到需求先弄清背景与用户真实痛点，复杂功能先做技术方案与数据流/组件结构梳理，再动手写代码。

## 代码格式化：Prettier

团队统一使用 Prettier，配合 \`.prettierrc\`、\`.prettierignore\`，并在保存时格式化。

\`\`\`bash
npm install --save-dev --save-exact prettier
echo {}> .prettierrc.json
\`\`\`

## Git 提交阶段：husky + lint-staged

在 \`pre-commit\` 中运行 lint-staged，避免未格式化代码进入仓库。

\`\`\`bash
npx husky init
npm install --save-dev lint-staged
\`\`\`

\`package.json\` 示例：

\`\`\`json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
\`\`\`

## Commit message：commitlint

使用 [Conventional Commits](https://www.conventionalcommits.org/) 风格，并用 \`commitlint\` 在 \`commit-msg\` 钩子中校验。

\`\`\`bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "module.exports = { extends: ['@commitlint/config-conventional'] }" > commitlint.config.js
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
\`\`\`

## UI 规范

推动设计师输出组件与视觉规范，前端沉淀组件库并与设计双向对齐（可参考 [Ant Design 设计价值观](https://ant.design/docs/spec/introduce-cn)）。

## 总结

规范的目标是**一致性**与**更低沟通成本**；规则应可演进，不适用的要敢于重写。

> 以上为根据原文整理的要点摘录，排版与更新请以 [掘金原文](https://juejin.cn/post/7085257325165936648) 为准。

![阅读氛围参考](https://picsum.photos/720/400)
`;export{e as default};