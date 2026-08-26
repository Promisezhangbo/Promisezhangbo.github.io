# 4. 类组件与生命周期

**版本：** 类组件从 **0.13/0.14** 起就是主流；**16.3** 换了一批生命周期；**16.8** 之后新功能优先加在 Hooks 上。新项目可以不写 class，但排错、读 Antd 老示例、Error Boundary **仍然要认识**。

## 4.1 最小形态

```tsx
import { Component } from 'react';

type Props = { title: string };
type State = { n: number };

class Counter extends Component<Props, State> {
  state: State = { n: 0 };

  inc = () => this.setState((s) => ({ n: s.n + 1 }));

  render() {
    return (
      <button type="button" onClick={this.inc}>
        {this.props.title}: {this.state.n}
      </button>
    );
  }
}
```

要点：

- 必须 `render()` 返回元素。
- `setState` 可传对象或函数；同样会批处理（18 后异步路径也批）。
- 事件回调记得绑定 `this`（类字段箭头函数、`bind`，或在 JSX 里箭头——后者每次新函数）。
- `this.props` / `this.state` 不要直接赋值；state 更新异步，读最新值用函数式 `setState`。

`PureComponent`（**≥15.3**）：`shouldComponentUpdate` 里浅比较 props 和 state。

## 4.2 生命周期全图（16.3 之后）

挂载：

1. `constructor`
2. `static getDerivedStateFromProps`（**≥16.3**，mount + update）
3. `render`
4. `componentDidMount`

更新：

1. `getDerivedStateFromProps`
2. `shouldComponentUpdate`
3. `render`
4. `getSnapshotBeforeUpdate`（**≥16.3**，DOM 更新前读布局）
5. `componentDidUpdate(prevProps, prevState, snapshot)`

卸载：`componentWillUnmount`

错误：`static getDerivedStateFromError` + `componentDidCatch`（**≥16.0** Error Boundary）

## 4.3 被废弃的「Will」系列

这些会在 render 之前同步跑，容易和异步渲染冲突，**16.9** 改名为 `UNSAFE_*`，新代码不要写：

- `componentWillMount` → 用 `constructor` / `componentDidMount` / `getDerivedStateFromProps`
- `componentWillReceiveProps` → `getDerivedStateFromProps` 或把派生数据放到 render
- `componentWillUpdate` → `getSnapshotBeforeUpdate` / `componentDidUpdate`

**19** 仍可能在依赖里见到 `UNSAFE_`，不要在新文件里复制。

## 4.4 `getDerivedStateFromProps` 慎用

它是静态方法，**拿不到 `this`**，返回对象合并进 state，返回 `null` 表示不改。

多数「props 变了要重置 state」用 **`key={id}`** 更干净。用 gDSFP 容易写出「props 和 state 双份真相」。

## 4.5 Error Boundary 为什么还是 class

```tsx
class ErrorBoundary extends Component<{ children: React.ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error(err, info.componentStack);
  }

  render() {
    if (this.state.err) return <p>出错了</p>;
    return this.props.children;
  }
}
```

Hooks **没有** `componentDidCatch` 等价物。生产里常用 `react-error-boundary` 包（内部仍是 class）。

它 **抓不到**：事件处理器、异步 `setTimeout`、服务端、自身 render 错误的边界外层。事件错误请自己 `try/catch`。

## 4.6 和函数组件怎么选

| | 类组件 | 函数 + Hooks |
| --- | --- | --- |
| 新功能（Transition、`use`） | 基本没有 | 官方主线 |
| Error Boundary | 能 | 不能（要包一层 class） |
| `this` 绑定 | 烦 | 无 |
| 逻辑复用 | mixin/HOC 历史包袱 | 自定义 Hook |

维护期：碰到 class 用对照表翻译成 Hook 即可，不必先「全部改完」再加功能。
