export default {
  // turbo 的 lint 不接受文件参数；用函数忽略 lint-staged 传入的文件列表
  '**/*.{js,jsx,ts,tsx,vue}': () => 'pnpm lint',

  // stylelint 我们只针对源码目录；仍然跑一次全局 stylelint（它会读 .stylelintignore）
  '**/*.{css,scss}': () => ['pnpm lint:style', 'pnpm lint'],

  // json/md 仍用项目的 lint（避免把文件列表拼到 turbo 后）
  '**/*.{json,md}': () => 'pnpm lint',

  // 子应用列表或同步逻辑变更时，对齐 deploy.yml 下拉（无差异则瞬时跳过）
  'apps/**/package.json': () => 'pnpm deploy:sync-workflow-options',
  'scripts/deploy/sync_deploy_workflow_options.mjs': () => 'pnpm deploy:sync-workflow-options',
  'scripts/deploy/repo_apps.mjs': () => 'pnpm deploy:sync-workflow-options',
  'packages/micro-app-cli/micro-apps.registry.json': () => ['pnpm micro-app:sync', 'pnpm deploy:sync-workflow-options'],
};
