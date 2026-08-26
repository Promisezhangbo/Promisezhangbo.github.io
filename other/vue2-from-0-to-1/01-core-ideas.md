# 1. 核心思想与模板

**版本：≥2.0（2016-09）。**

## 1.1 Vue 2 是什么

用 **声明式模板** 把数据和 DOM 绑在一起：改数据，视图更新。组件是带 Options 的 Vue 实例；根实例 `new Vue({ el, data, ... })`。

和 React 的直觉差异：

- 模板里用的是 **可变的 data**，不是每次 render 返回新元素树给你看。
- 依赖收集：模板/`computed` 读过的属性才会触发更新（getter/setter），不是「整个函数重跑再 diff」那么简单（内部仍有 VNode + diff）。

## 1.2 应用入口

```js
import Vue from 'vue';
import App from './App.vue';

new Vue({
  render: (h) => h(App),
}).$mount('#app');
```

- 2.x **没有** `createApp`，全局 `Vue.use` / `Vue.component` 是 **进程级单例**，多实例微前端容易互相污染。
- `el` 或 `$mount` 指定挂载点；挂载后根实例是 `vm`。

## 1.3 单文件组件（SFC）

```vue
<template>
  <div class="box">{{ title }}</div>
</template>

<script>
export default {
  name: 'Box',
  data() {
    return { title: '你好' };
  },
};
</script>

<style scoped>
.box { padding: 8px; }
</style>
```

- `<template>` 在 2.x **必须单根节点**（3 才允许多根）。
- `scoped`：属性选择器隔离；子组件根节点会吃父的 scoped 属性，用来写「子根样式」。
- `lang="scss"` 等靠 webpack/vue-cli 加载器。

## 1.4 模板表达式

只能写 **表达式**（能放到 `return` 右边的），不能写 `if`/`for` 语句。用指令或 computed。

```vue
{{ msg }}
{{ ok ? '是' : '否' }}
<div :title="tooltip"></div>
```

`{{ }}` 会转义 HTML。真要插 HTML 用 `v-html`（XSS 风险，只信得过的字符串）。

## 1.5 `h` / `createElement`

`render(h) { return h('div', { class: 'a' }, [this.title]); }`  
jsx 在 2 里要 babel 插件，不是默认。绝大多数 2 项目写 template。
