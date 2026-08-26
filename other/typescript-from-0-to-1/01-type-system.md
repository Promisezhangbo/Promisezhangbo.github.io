# 1. 类型系统

TypeScript = **带静态类型的 JavaScript**。类型在编译期检查，运行时（默认）全部擦掉。浏览器跑的仍是 JS。

## 1.1 为什么要类型

- 改函数参数时，调用方立刻红线，而不是线上 `undefined.foo`。
- 编辑器补全来自类型，不是猜。
- 重构（改名、挪文件）可靠。

它 **不是** 运行时校验库（那是 zod 的事）。`interface` 不会出现在产物里。

## 1.2 基础类型

```ts
let n: number = 1;
let s: string = 'a';
let b: boolean = true;
let u: undefined;
let nil: null;
const arr: number[] = [1, 2];
const tup: [string, number] = ['age', 1];
```

**≥2.0 `strictNullChecks`：** `string` 不能赋 `null`；要空用 `string | null`。

| 顶层类型 | 含义 |
| --- | --- |
| `any` | 关闭检查，能传能调。能不用就不用 |
| `unknown` **≥3.0** | 「我还不知道」：必须收窄后才能用 |
| `never` | 不该发生 / 穷尽检查 |
| `void` | 函数无有意义返回 |
| `object` | 非原始值（太宽，少用） |

## 1.3 联合、交叉、收窄

```ts
type Id = string | number;
function f(x: Id) {
  if (typeof x === 'string') x.toUpperCase();
}
type A = { a: 1 } & { b: 2 }; // { a:1, b:2 }
```

收窄：`typeof` / `in` / `instanceof` / 相等 / 自定义谓词 `x is Cat`。  
可辨识联合：

```ts
type Ev = { type: 'click'; x: number } | { type: 'key'; code: string };
```

## 1.4 对象、接口、`type`

```ts
interface User { id: string; name?: string }
type User2 = { id: string; readonly id2?: string };
```

- 可选 `?`：可以缺，值仍可能是 `undefined`。
- 索引：`Record<string, number>`、`{ [k: string]: number }`。
- **接口可合并声明**（适合给库补类型）；`type` 更适合联合/元组。

## 1.5 函数

```ts
function add(a: number, b: number): number { return a + b; }
const add2 = (a: number, b: number) => a + b;
type Fn = (a: number) => number;
```

可选参数在后；`?` 与 `= 默认值` 不同。剩余参数 `...args: number[]`。  
回调里尽量让 TS 推断参数，不要每个都手写。

重载：多个声明 + 一个实现（实现要用宽类型）。能用联合就别上重载。

## 1.6 泛型

```ts
function first<T>(xs: T[]): T | undefined { return xs[0]; }
first([1, 2]); // T=number
```

约束：`T extends { id: string }`。  
**≥5.0** `const` 类型参数：`function id<const T>(x: T)` 推断更窄的字面量。

常用工具类型（标准库）：`Partial` `Required` `Pick` `Omit` `Record` `ReturnType` `Parameters` `Awaited`（≥4.5）。

条件类型 **≥2.8：** `T extends string ? A : B`，`infer R` 抽出一块。

## 1.7 `typeof` / `keyof` / 索引访问

```ts
const cfg = { port: 1 as const };
type Cfg = typeof cfg;
type Keys = keyof Cfg; // "port"
type Port = Cfg['port'];
```

映射类型：`{ [K in keyof T]: T[K] | null }`  
模板字面量类型 **≥4.1：** `` `on${Capitalize<K>}` ``

## 1.8 断言与 `satisfies` ≥4.9

```ts
const el = document.querySelector('#a') as HTMLDivElement; // 你比编译器确定
const el2 = document.querySelector('#a')!; // 非空断言，炸了是你的事
```

少用断言。配置对象推荐：

```ts
const routes = [
  { path: '/', component: Home },
] as const satisfies readonly { path: string; component: unknown }[];
```

`satisfies`：检查符合某类型，但 **保留更窄的推断**（不像 `as Type` 把类型拓宽）。

## 1.9 类、枚举（本仓库基本不用）

class 字段类型、`implements`、访问修饰符是早期特性。  
`enum` 会 **生成运行时对象**。**≥5.8 `erasableSyntaxOnly`** 直接禁止。用联合字面量：`type Status = 'on' | 'off'`。

## 1.10 声明文件

`.d.ts` 描述 JS 库。`declare module 'foo'`。DefinitelyTyped：`@types/react`。  
`skipLibCheck: true`（本仓库有）：不深究别人 `.d.ts` 的错误，加快检查。
