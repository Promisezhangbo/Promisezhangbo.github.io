var e=`---
title: Tasks, microtasks, queues and schedules
summary: Jake Archibald on the event loop, tasks vs microtasks, and rendering.
source: https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
category: js
---

## Core idea

The browser schedules **tasks** (macrotasks) and **microtasks** in separate queues. **Microtasks** run after the current task finishes and before the next task — e.g. \`Promise.then\` callbacks.

## Order intuition

\`\`\`js
console.log('script start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('script end');
// script start → script end → promise → timeout
\`\`\`

## Why it matters

Understanding ordering prevents subtle bugs when mixing **DOM updates**, **promises**, and **\`setTimeout\`**, especially around **layout** and **paint**.

## Takeaways

1. **Microtasks** drain until empty before the next **task**.  
2. **\`await\`**/\`then\` schedules microtasks.  
3. **\`requestAnimationFrame\`** is tied to the render pipeline — not the same as microtasks.

> Full diagrams and edge cases: [read the original article](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/).
`;export{e as default};