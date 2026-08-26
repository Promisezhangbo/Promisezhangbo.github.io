# 5. 组件、v-model、内置组件

## 5.1 声明事件 `emits` ≥3.0

```js
emits: ['save', 'update:modelValue']
// 或校验
emits: { save: (id) => typeof id === 'string' }
```

声明过的事件 **不会** 落入 `$attrs`，避免落到根 DOM 上变成原生监听。2 没有这层，容易把自定义事件漏到根节点。

## 5.2 `v-model` 变了

3 默认：prop `modelValue` + 事件 `update:modelValue`。

```vue
<!-- 父 -->
<Child v-model="text" />
<!-- 等价 -->
<Child :modelValue="text" @update:modelValue="text = $event" />
```

多个：`v-model:title="x"` → `title` + `update:title`。**删除 `.sync`。**

自定义组件修饰符：`v-model.trim` 会出现在 `modelModifiers` prop 里。

**≥3.4** 用 `defineModel()` 少写一大段（下一章）。

## 5.3 插槽

`v-slot` / `#name` 与 2.6 相同。作用域槽一样。`$slots` 在 3 里是函数（调用才渲染）。

## 5.4 `inheritAttrs`

默认非 prop 属性落到根节点。多根时必须自己 `v-bind="$attrs"` 绑到你想要的那一个，否则警告。

## 5.5 `Teleport` ≥3.0

```vue
<Teleport to="body">
  <div class="modal">...</div>
</Teleport>
```

对标 React Portal。`disabled` 可关。2 没有，只能手写 append。

## 5.6 `Suspense` ≥3.0

等异步 `setup` / 异步组件：

```vue
<Suspense>
  <AsyncPage />
  <template #fallback>加载中</template>
</Suspense>
```

错误要用 `onErrorCaptured` 或外层错误边界组件。嵌套、SSR 行为要读文档，别当万能 loading。

## 5.7 异步组件

```js
import { defineAsyncComponent } from 'vue';
const Book = defineAsyncComponent(() => import('./Book.vue'));
```

可配 `loadingComponent`、`delay`、`errorComponent`。

## 5.8 `v-memo` ≥3.2

```vue
<div v-memo="[item.id, selected]">...</div>
```

依赖不变则 **跳过该块 VNode 更新**。大列表热点用，类似 React `memo` 的模板版。乱加会让该更新的不更新。

## 5.9 `<Transition>` / `KeepAlive` / 动态 `component`

仍在。KeepAlive 的 `include` 用 **组件 name**（`defineOptions({ name })` 或文件名推断）。
