# 5. 响应式原理与陷阱（Vue 2 必读）

**版本：整条 2.x。** 这是 2 和 3 最大的运行时差别。3 用 Proxy，下面这些坑 **在 3 里基本消失**。

## 5.1 怎么追踪

初始化时 `Object.defineProperty` 给 `data` 每个 **已有** 属性加上 getter/setter。模板/`computed`/`watch` 在 getter 里收集依赖，setter 里通知 Watcher 更新。

因此：**后来才加上的字段默认不是响应式的。**

```js
data() {
  return { user: { name: 'Ada' } };
},
created() {
  this.user.age = 1; // 界面可能不更新
  this.$set(this.user, 'age', 1); // 正确
  // 或 this.user = { ...this.user, age: 1 }
}
```

`Vue.set(obj, key, val)` / `this.$set`  
`Vue.delete` / `this.$delete` 删除也要用，否则视图不掉。

## 5.2 数组

Vue 2 **包装**了 `push/pop/shift/unshift/splice/sort/reverse`，这些能触发更新。

**不能检测到：**

```js
this.list[0] = newItem;     // 按索引赋值
this.list.length = 0;       // 改 length
```

改成：`this.$set(this.list, 0, newItem)` 或 `this.list.splice(0, 1, newItem)`，清空用 `this.list = []`。

## 5.3 还检测不到的

- 直接 `this.data = obj` 替换整棵还行；**对象上新增根级 data 字段**（`this.foo = 1` 而 data 没声明 `foo`）不行，必须预先在 `data()` 里写出来。
- 不在 `data`/`computed`/`props` 上的普通实例字段（`this._cache = ...`）本来就不是响应式，这是刻意的。

## 5.4 `Vue.observable` ≥2.6

给任意对象做成响应式（小型全局 store）。3 对应 `reactive()`。注意 2.7 的 `reactive()` **会改原对象**，且 `reactive(foo) === foo`。

## 5.5 异步更新队列

同一 tick 里多次改 data **合并成一次** DOM 更新。要立刻读到新 DOM：`this.$nextTick()`。

## 5.6 和 React 对比（方便记）

| | Vue 2 | React |
| --- | --- | --- |
| 默认 | 可变 data + 依赖收集 | 不可变 state + 函数重跑 |
| 漏更新 | 新增字段、下标赋值 | 忘了 setState / 改了又塞回同一引用 |
| 强制 | `$set` `$forceUpdate` | `setState` 新对象 |
