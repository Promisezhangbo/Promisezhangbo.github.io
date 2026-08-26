# 0. Oxfmt 版本

随 Oxc 工具链发版，0.x/0.4x 仍可能改默认值。本仓库锁 `oxfmt ^0.42.0`。

目标：在 Prettier 3 的结果上 **尽量 diff 小**，让从 Prettier 迁过来的仓库只改命令行。不能保证 100% 字节级一致（注释折行、边角语法）。

语言覆盖：JS/TS/JSON/Markdown 等（以当前版本为准；Svelte 等在后加）。CSS 本仓库仍用 **Stylelint**，不是 oxfmt 一家包办。
