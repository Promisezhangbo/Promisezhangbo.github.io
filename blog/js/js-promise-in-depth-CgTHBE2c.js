var e=`---
title: JavaScript Promise 与异步编程（SegmentFault）
summary: Promise 基础、链式调用与错误处理导读。
source: https://segmentfault.com/a/1190000016418021
category: js
---

## Promise 解决了什么

回调嵌套（「回调地狱」）难以组合与处理错误。\`Promise\` 提供 **thenable** 链式调用与统一的 **catch** 出口。

## 基础用法

\`\`\`js
fetch('/api/data')
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
\`\`\`

## 常见误区

- 忘记 **return** 下一个 Promise，导致链断裂  
- 在 \`then\` 里抛错未进入 \`catch\`（需理解同步抛错与异步抛错）  
- 混淆 **\`Promise.all\`**（全成功）与 **\`Promise.allSettled\`**（全部落定）  

## 与 async/await

\`async/await\` 是 Promise 的语法糖，底层仍是微任务调度。

> 完整原文：[SegmentFault 链接](https://segmentfault.com/a/1190000016418021)（若遇 410，可换网络或检索文章标题）。
`;export{e as default};