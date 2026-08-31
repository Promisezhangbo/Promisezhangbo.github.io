# 8. Diff 算法

对应 [卡颂第五章](https://react.iamkasong.com/diff/prepare.html)。Didact 只按 **下标** 比 `type`（[03](./03-commit-and-reconciliation.md)）；官方在 `ReactChildFiber.js` 的 `reconcileChildFibers`。算法从 16 到 19.2 没有换骨架。

## 8.1 一次更新里最多四份东西

同一个 DOM 节点在某一时刻可能同时和这四份描述有关：

| 东西 | 角色 |
| --- | --- |
| **current Fiber** | 已经画在屏幕上的那份 |
| **workInProgress Fiber** | 这次要生成、准备画上去的那份 |
| **DOM 节点** | 宿主实例，`stateNode` |
| **JSX / element** | 这次 `render()` 或函数组件的返回值 |

Diff 的本质：**拿 current Fiber 和这次的 JSX 比，生成 WIP Fiber**（并打 flags）。

完全比对两棵树是 O(n³)，1000 个节点就是十亿级比较。React 用三条限制把复杂度压到 O(n)：

1. **只比同级。** 节点跨层（`div` 里的 `span` 挪到外面）不尝试复用，当新节点建、旧的删。
2. **type 不同就整棵子树拆掉。** `<div>` 换成 `<p>`，子孙全部卸掉重建，不递归猜能不能挪。
3. **开发者用 `key` 声明「还是同一个」。** 没有 key 时列表换位会被当成「这个位置 type 变了」。

```jsx
// 无 key：第一个孩子 p→h3、第二个 h3→p，两次都拆建
// 有 key：只交换顺序，DOM 复用
<div>
  <p key="ka">ka</p>
  <h3 key="song">song</h3>
</div>
<div>
  <h3 key="song">song</h3>
  <p key="ka">ka</p>
</div>
```

列表里用 index 当 key，一旦中间插入/删除，后面的 key 全错，等于废了第 3 条。

## 8.2 入口：按「同级几个节点」分支

`reconcileChildFibers(returnFiber, currentFirstChild, newChild)`：

| `newChild` | 走哪条 | 同级数量 |
| --- | --- | --- |
| 元素对象（`$$typeof === REACT_ELEMENT_TYPE`） | `reconcileSingleElement` | 单节点 |
| `string` / `number` | `reconcileSingleTextNode` | 单节点 |
| 数组 | `reconcileChildrenArray` | 多节点 |
| 其它对不上 | `deleteRemainingChildren` | 全删 |

Fragment、Portal、Iterable 还有专门分支，心智相同：先看能不能当「一个孩子」，否则当列表。

## 8.3 单节点 Diff

[卡颂 · 单节点](https://react.iamkasong.com/diff/one.html)。从 `currentFirstChild` 顺着 `sibling` 找 **唯一** 那个能复用的：

1. `key` 相同（没写 key 则两边都是 `null`，也算相同）
2. `type` / `elementType` 相同

都满足 → `useFiber` 复用 DOM，剩下的兄弟全部 `Deletion`。

对不上时有个细节：

| 情况 | 删除范围 |
| --- | --- |
| **key 相同、type 不同** | `deleteRemainingChildren`：当前这个 **以及后面所有兄弟**。唯一候选已经废了，后面不可能再匹配这一个新节点 |
| **key 不同** | 只 `deleteChild` 当前这个，继续看下一个 sibling |

例子：页面是 `ul > li * 3`，更新成 `ul > p`。属于单节点 Diff。三个 `li` 逐个看能不能给这个 `p` 复用；对不上的打删除。

判断能不能复用（卡颂练习）：

| 更新前 | 更新后 | 复用？ |
| --- | --- | --- |
| `<div>ka</div>` | `<p>ka</p>` | 否。key 都是 `null`，type 变了 |
| `<div key="xxx">` | `<div key="ooo">` | 否。key 先比，已经不同 |
| `<div key="xxx">` | `<p key="ooo">` | 否 |
| `<div key="xxx">ka</div>` | `<div key="xxx">xiao</div>` | **是。** 复用 DOM，子文本走 Update |

## 8.4 多节点 Diff

同级是数组时，官方分两趟（思想；函数名随版本会变）：

**第一趟：从左往右吃掉能原地复用的前缀。**

新旧都从下标 0 走。`key`+`type` 对上就复用，`lastPlacedIndex` 记下「已经放到的最右旧位置」。一旦对不上，跳出第一趟。

**第二趟：剩下的旧节点放进 Map（有 key 用 key，没 key 用下标），剩下的新节点逐个查表。**

- 查到且 type 对 → 复用，并看旧 `index` 和 `lastPlacedIndex`：旧节点要 **往右挪** 才打 `Placement`（插入到新位置）；往左移的情况靠别人插入自然挤过去，避免每个节点都移动
- 查不到 → 新建，`Placement`
- Map 里最后还剩的旧节点 → `Deletion`

这就是「尽量少动 DOM」的启发式，不是最优编辑距离。

Didact 没有第二趟，所以 `[a, b]` 变成 `[b, a]` 会当成两个 type 都变了，DOM 全拆。官方有 key 时只交换。

## 8.5 和 flags 的关系

Diff 的产出不是「新 DOM」，而是 WIP 上的标记：

- `Placement`：插入（含移动）
- `Update`：同节点改 props
- `Deletion`：卸掉（打在 **current** 那侧，挂到父的 `deletions`）

真正 `appendChild` / `removeChild` 在 commit 的 mutation 段（[06](./06-react-18-source.md)）。

## 8.6 读源码时搜什么

`packages/react-reconciler/src/ReactChildFiber.js`：

- `reconcileChildFibers` / `mountChildFibers`（`shouldTrackSideEffects`）
- `reconcileSingleElement`
- `reconcileChildrenArray`
- `placeChild`（决定要不要 `Placement`）
- `updateSlot` / `updateFromMap`（第二趟）
