# 2. Proxy 响应式

**版本：≥3.0。** 用 `Proxy` 拦截对象读写，**不再**需要 `Vue.set` / 禁止按下标改数组。IE11 被放弃就是这个原因。

## 2.1 `ref`

给原始值或对象包一层 `{ value }`。

```js
import { ref } from 'vue';
const n = ref(0);
n.value++;          // script 里要 .value
// 模板里自动解包：{{ n }} 不用 .value
```

对象放进 `ref` 时，`.value` 内部仍是 reactive 的。`ref` 进 `reactive` 对象会被解包。

`isRef` / `unref` / `toRef` / `toRefs` / `toValue`（3.3+ 更统一的规范化）常用在写 composable 时兼容「也许是 ref」。

## 2.2 `reactive`

```js
const state = reactive({ count: 0, nested: { a: 1 } });
state.count++;
state.nested.a = 2;
state.list[0] = 'x'; // 3 能检测到
state.newbie = true; // 3 能检测到
```

- `reactive(obj) !== obj`（是新 Proxy）。2.7 回移植则是 `===`。
- **不要**解构丢掉响应：`let { count } = state` 后 `count++` 不改原对象。用 `toRefs(state)` 或保持 `state.count`。
- 对原始类型用 `ref`，对一组紧密字段用 `reactive`。团队里「能 ref 就 ref」也完全成立。

`shallowRef` / `shallowReactive`：只代理一层，大对象/第三方实例用。  
`readonly` / `shallowReadonly`：只读视图。  
`markRaw`：跳过代理（标进 reactive 树的库实例）。

## 2.3 `computed`

```js
const doubled = computed(() => n.value * 2);
doubled.value;
const writable = computed({
  get: () => n.value,
  set: (v) => { n.value = v; },
});
```

只读 computed 的 `.value` 再赋值会警告。

## 2.4 触发时机

同样异步批处理 DOM。`nextTick()` 从 `'vue'` 导入（不必 `this.$nextTick`，Options 里仍有）。

## 2.5 `watch` / `watchEffect`

```js
watch(n, (n, o) => { ... });
watch(() => state.count, cb);
watch([a, b], ([na, nb]) => { ... });
watch(state, cb, { deep: true });

watchEffect(() => {
  console.log(n.value); // 自动收集依赖
});
```

都返回 **停止函数**。`flush: 'post' | 'sync' | 'pre'`。  
**≥3.5** `onWatcherCleanup(fn)`：在 watch 回调里注册清理（如下一次跑之前 abort fetch），比在回调开头手写更干净。

## 2.6 和 Vue 2 陷阱对照

| 2.x | 3.x |
| --- | --- |
| `$set` 加字段 | 直接赋值 |
| 数组 `arr[i] =` | 直接赋值 |
| `data` 必须预声明字段 | `ref`/`reactive` 上现加即可 |
| `reactive(x) === x`（仅 2.7 假 API） | `!==` |

3 仍要注意：给 `reactive` **换成另一个对象** `state = reactive(newObj)` 会丢掉已有代理引用；应 `Object.assign` 或整棵 `ref` 替换 `.value`。
