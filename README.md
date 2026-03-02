# 说明文档

## 项目说明

## 配置相关

### ts相关配置

ts的配置做了一个基础的抽离，将公共的配置单独抽成了一个包，便于维护及形成一个公共规范这个包叫做 @packages/ts-config, 并且通过pnpm workspace:\* 的方式链接到子应用修改 @packages/ts-config 的配置后,子应用便可直接生效

如修改不生效，请检查子应用 package.json的依赖配置，或则子应用的tsconfig.json 配置

```bash
# 或者直接进行一次
pnpm i
```

### eslint 相关配置

eslint 配置做了一个基础的抽离，将公共的配置单独抽成了一个包，便于维护及形成一个公共规范这个包叫做 @packages/eslint-config, 并且通过pnpm workspace:\* 的方式链接到子应用修改 @packages/eslint-config 的配置后,子应用便可直接生效

如修改不生效，请检查子应用 package.json的依赖配置，或则子应用的 eslint.config.js 配置

```bash
# 或者直接进行一次
pnpm i
```

### Prettier

参考链接[https://juejin.cn/post/7085257325165936648] 配合 .vscode/setting 配置及vscode 插件保存自动格式化 ![prettier 插件](./docs/assets/prettier.png) 这个在根目录下配置，修改 @packages/prettier-config 的配置后,子应用便可直接生效

如修改不生效，请检查子应用 package.json的依赖配置，或则子应用的 eslint.config.js 配置

```bash
# 或者直接进行一次
pnpm i
```

### git 配置

遵守angular 团队commit规范commit规范[https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#type]
