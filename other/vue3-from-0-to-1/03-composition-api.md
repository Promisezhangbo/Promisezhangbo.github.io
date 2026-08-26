# 3. Composition API

**版本：≥3.0 稳定。** 按 **功能** 把 `ref`/`watch`/生命周期收进普通函数（composable），而不是按 Options 切片。逻辑复用替代 mixin。

## 3.1 `setup`

Options 里的入口，在 `beforeCreate` 之后、`created` 之前跑，**没有 `this`**。

```js
export default {
  props: { id: String },
  emits: ['save'],
  setup(props, { emit, slots, attrs, expose }) {
    const n = ref(0);
    watch(() => props.id, load);
    onMounted(load);
    function save() { emit('save', n.value); }
    expose({ n }); // 给父 $refs
    return { n, save }; // 给模板
  },
};
```

`props` 是响应式对象，**不要解构**（3.5 前会丢响应；3.5 起编译器可把解构编译回 `props.x`，见第 6 章）。

## 3.2 生命周期对照

| Options（3 的名字） | Composition |
| --- | --- |
| `beforeCreate` / `created` | `setup` 本身 |
| `beforeMount` | `onBeforeMount` |
| `mounted` | `onMounted` |
| `beforeUpdate` | `onBeforeUpdate` |
| `updated` | `onUpdated` |
| `beforeUnmount` | `onBeforeUnmount` |
| `unmounted` | `onUnmounted` |
| `errorCaptured` | `onErrorCaptured` |
| `activated` / `deactivated` | `onActivated` / `onDeactivated` |
| 2 的 `destroyed` | 改名为 `unmounted` |

必须在 `setup` 同步调用这些 `onXxx`（和 React Hooks 一样不能放进 `setTimeout`）。

## 3.3 composable 约定

函数名 `useXxx`，内部用 ref/watch/onMounted，**return 出去的才是接口**。

```js
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue';
export function useMouse() {
  const x = ref(0);
  const move = (e) => { x.value = e.pageX; };
  onMounted(() => window.addEventListener('mousemove', move));
  onUnmounted(() => window.removeEventListener('mousemove', move));
  return { x };
}
```

不要在 composable 里假设一定有组件实例（`getCurrentInstance()` 能拿但属于逃生舱）。

## 3.4 `provide` / `inject`

```js
// 父
const theme = ref('dark');
provide('theme', theme); // 传 ref，子才能跟着变

// 子
const theme = inject('theme', ref('light')); // 默认值
```

比 2 简单：传 `ref`/`reactive` 就是响应式。键可用 `Symbol`。`app.provide` 给整应用。

## 3.5 `effectScope` ≥3.2

把一堆 effect 绑在一个 scope，`scope.stop()` 一次停掉。写库、手动挂载时用，页面级少写。
