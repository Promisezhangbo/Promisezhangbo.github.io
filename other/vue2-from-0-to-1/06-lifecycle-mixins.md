# 6. 生命周期、混入、内置组件

## 6.1 钩子（2.x 名字）

创建：`beforeCreate` → `created`（已有 data/props，**还没有** `$el`）  
挂载：`beforeMount` → `mounted`（有 `$el`，子组件也 mounted）  
更新：`beforeUpdate` → `updated`（DOM 已补丁）  
销毁：`beforeDestroy` → `destroyed`（3 改名为 `beforeUnmount` / `unmounted`）

另：

- `activated` / `deactivated`：被 **`<keep-alive>`** 缓存时
- `errorCaptured` **≥2.5**：子孙错误

SSR：`serverPrefetch`（2.6 附近的 SSR 生态）。

请求、订事件放 `created` 或 `mounted`（看要不要 DOM）。取消请求、`removeEventListener` 放 `beforeDestroy`。

## 6.2 `keep-alive`

```vue
<keep-alive :include="['A']" :max="10">
  <router-view />
</keep-alive>
```

切走不销毁，状态还在。缓存组件用 `activated` 当「又显示了」，不要只靠 `mounted`。

## 6.3 `<transition>` / `<transition-group>`

给 `v-if`/`v-show`/动态组件加 CSS/JS 过渡。`transition-group` 要求子项有 `key`。3 的 API 大体还在，class 名策略类似。

## 6.4 `<component :is="comp">`

动态组件。配合 keep-alive 做 tab。

## 6.5 mixin / extends

```js
const logger = {
  created() { console.log('mix'); },
  methods: { log() {} },
};
export default { mixins: [logger] };
```

钩子会合并执行，**同名 methods/data 字段难排查**。2 的大型项目后期几乎都被 composable（2.7）或 3 取代。新代码不要再堆全局 mixin。

## 6.6 过滤器 `filters`（3 已删）

```vue
{{ price | currency }}
```

```js
filters: {
  currency(v) { return '$' + v; },
}
```

能 chained：`{{ x | a | b }}`。迁移：改 computed 或方法。

## 6.7 实例事件总线（3 已删）

```js
Vue.prototype.$bus = new Vue();
this.$bus.$on('x', fn);
this.$bus.$emit('x');
```

2 里常见，卸载必须 `$off`。3 没有 `$on`，不要学成「官方推荐」。
