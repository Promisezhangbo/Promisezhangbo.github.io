var e=`---
title: Vite 插件与生态实践笔记
summary: 与 Vite 插件开发、钩子与生态相关的掘金文章导读。
source: https://juejin.cn/post/7157739406835580965
category: arch
---

## Vite 插件在做什么

Vite 插件与 Rollup 插件模型兼容，在 **开发服务器**与**构建**阶段通过钩子介入模块解析、转换与输出。

## 常用钩子（概念）

- \`config\` / \`configResolved\`：合并配置  
- \`resolveId\` / \`load\` / \`transform\`：模块解析与转译  
- \`configureServer\`：开发中间件、HMR 相关  

## 最小插件骨架

\`\`\`ts
import type { Plugin } from 'vite';

export function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    transform(code, id) {
      if (!id.endsWith('.txt')) return null;
      return { code: \`export default \${JSON.stringify(code)}\`, map: null };
    },
  };
}
\`\`\`

## 实践建议

1. 优先查阅 [Vite 插件 API](https://cn.vitejs.dev/guide/api-plugin.html)。  
2. 区分 **仅开发需要** 与 **构建也需要** 的逻辑。  
3. 注意 \`ssr\` 与 \`worker\` 场景下的兼容性。

> 案例与完整论述见 [掘金原文](https://juejin.cn/post/7157739406835580965)。
`;export{e as default};