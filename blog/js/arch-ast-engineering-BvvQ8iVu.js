var e=`---
title: 前端工程化基石：AST 与抽象语法树
summary: AST 在编译、转译与代码分析中的角色，串联 Babel 等工具链。
source: https://juejin.cn/post/7155151377013047304
category: arch
---

## 什么是 AST

**抽象语法树（AST）** 是源代码的树状结构表示，剔除了空格、注释等细节，保留语法结构，便于程序分析与变换。

## 为什么工程化离不开 AST

| 场景       | 作用说明                          |
| ---------- | --------------------------------- |
| 转译       | ESNext → 当前环境可运行代码       |
| Lint       | 规则检查、自动修复                |
| 打包优化   | 依赖分析、Tree Shaking 辅助信息   |
| 代码生成   | 脚手架、低代码、文档提取          |

## 极简示例：表达式如何变成树

表达式 \`a + b * 2\` 在 AST 中通常体现为「加法节点」包含左子树（标识符 \`a\`）与右子树（乘法节点 \`b * 2\`）。

\`\`\`js
// 伪代码：遍历 AST 节点时常见入口
function walk(node, visitor) {
  visitor.enter?.(node);
  for (const child of node.children ?? []) walk(child, visitor);
  visitor.exit?.(node);
}
\`\`\`

## 与 Babel 的关系

Babel 将源码解析为 AST，经插件链变换后再生成代码。编写 Babel 插件本质就是**访问与修改 AST 节点**。

## 学习建议

1. 使用 [AST Explorer](https://astexplorer.net/) 对照源码查看不同解析器的输出。  
2. 从「只读」分析类需求入手，再尝试小范围 transform。  
3. 注意与 **Source Map** 配合，保证调试体验。

> 详细案例与图示见 [掘金原文](https://juejin.cn/post/7155151377013047304)。
`;export{e as default};