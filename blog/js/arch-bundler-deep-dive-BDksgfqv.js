var e=`---
title: 现代打包工具与工程实践（SegmentFault）
summary: 构建链路、拆包、Tree Shaking 与性能相关话题导读。
source: https://segmentfault.com/a/1190000044622503
category: arch
---

## 说明

SegmentFault 部分文章在部分网络环境下返回 **410** 或需登录，本站以**本地导读**呈现，完整内容请打开原文。

## 阅读时可关注的清单

- **入口与依赖图**：从 entry 到 chunk 的划分策略  
- **Tree Shaking**：副作用标记、\`sideEffects\` 字段  
- **拆包**：\`splitChunks\`、动态 \`import()\` 与路由级懒加载  
- **缓存**：持久化缓存、CI 构建加速  

## 代码示意：动态导入

\`\`\`js
const Page = lazy(() => import('./HeavyPage.tsx'));
\`\`\`

## 小结

打包器是「开发体验」与「线上体积」的折中点；度量 **bundle 分析报表** 后再做优化，比凭感觉删依赖更可靠。

> [打开 SegmentFault 原文](https://segmentfault.com/a/1190000044622503)
`;export{e as default};