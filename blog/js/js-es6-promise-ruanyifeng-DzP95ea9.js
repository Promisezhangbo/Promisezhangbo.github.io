var e=`---
title: ES6 入门：Promise
summary: 阮一峰教程 Promise 章节要点摘录。
source: https://es6.ruanyifeng.com/#docs/promise
category: js
---

## Promise 的三种状态

- **Pending**（进行中）  
- **Fulfilled**（已成功）  
- **Rejected**（已失败）  

状态一旦从 pending 变为 fulfilled 或 rejected，就**不可再变**。

## 构造与基本链式

\`\`\`js
const p = new Promise((resolve, reject) => {
  if (ok) resolve(value);
  else reject(err);
});

p.then((v) => console.log(v)).catch((e) => console.error(e));
\`\`\`

## Promise.all / race

- **\`Promise.all\`**：全部成功才 \`resolve\`，任一 \`reject\` 则整体 \`reject\`。  
- **\`Promise.race\`**：第一个落定（成功或失败）的结果作为结果。

\`\`\`js
Promise.all([p1, p2]).then(([a, b]) => {});
Promise.race([p1, p2]).then((first) => {});
\`\`\`

## 与本书其他章节

可与 **async**、**Generator**、**Module** 等章节对照，形成完整的异步与模块化心智模型。

> 最新修订与更多示例见 [阮一峰 ES6 入门 — Promise](https://es6.ruanyifeng.com/#docs/promise)。
`;export{e as default};