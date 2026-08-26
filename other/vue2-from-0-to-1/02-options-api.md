# 2. Options API

**版本：≥2.0。** 这是 Vue 2 的主语言。逻辑按 **选项类型** 分块，而不是按功能横切（后者是 3 的 composable）。

## 2.1 `data` 必须是函数

```js
export default {
  data() {
    return { count: 0, user: { name: '' } };
  },
};
```

组件里 `data` 返回 **新对象**，避免实例共享同一份状态。根 `new Vue({ data: { ... } })` 可以用纯对象。

模板和 `this.count` 都是这个对象上的响应式字段。

## 2.2 `computed`

有缓存的派生值：依赖的响应式数据不变，多次访问不重算。

```js
computed: {
  fullName() {
    return this.first + ' ' + this.last;
  },
  // 少用：可读可写
  n: {
    get() { return this.count; },
    set(v) { this.count = v; },
  },
}
```

能 computed 就不要用带副作用的 watch 去 `this.x = ...` 同步另一份数据。

## 2.3 `methods`

事件、命令式逻辑。每次渲染都是同一函数引用（定义在原型/选项上），**不要**在 `data` 里放函数。

模板：`@click="save"` 或 `@click="save($event)"`。写 `@click="save()"` 会立刻带当前实参调用，和 React 一样注意不要多余括号搞错。

## 2.4 `watch`

数据变了再干活（请求、操作 DOM、和外部系统同步）。

```js
watch: {
  keyword(n, o) { this.search(n); },
  // 深度
  user: { handler(n) { ... }, deep: true, immediate: true },
  // 字符串路径
  'user.name'(n) { ... },
}
```

- `immediate: true`：创建时先跑一次。
- `deep: true`：对象内部字段；开销大。
- 回调里改 **自己正在看的那个值** 容易死循环。

`this.$watch('x', cb)` 可在 `created` 里动态注销（返回 unwatch 函数）。

## 2.5 选项合并顺序（知道即可）

mixin / extends 会把钩子 **排成数组都执行**，`methods` **同名覆盖**（组件自己的优先）。这是 mixin 难维护的原因。

## 2.6 常用实例属性

| 属性 | 含义 |
| --- | --- |
| `this.$el` | 根 DOM |
| `this.$data` | data 对象 |
| `this.$props` | props |
| `this.$refs` | 模板 `ref` |
| `this.$slots` / `this.$scopedSlots` | **2.6** 起建议只用 `$scopedSlots` 读；2.6 也开始统一 |
| `this.$attrs` | 没声明成 prop 的特性 |
| `this.$listeners` | 父级 `v-on`（不含 `.native`） |
| `this.$parent` / `$root` / `$children` | 能用但别当数据层 |
| `this.$set` `$delete` `$nextTick` | 见响应式、DOM 更新时机 |

`$nextTick(fn)`：等本次 DOM 更新完。改 data 后立刻量高度必须 nextTick。
