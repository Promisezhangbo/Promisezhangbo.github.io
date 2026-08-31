import{i as e}from"./rolldown-runtime-BFlkjK8w.js";import{C as t,D as n,F as r,I as i,P as a,R as o,S as s,V as c,c as l,s as u,u as d,w as f,x as p,z as m}from"./vendor-Cj7sZB5p.js";import{i as h,t as g}from"./react-vendor-D_40RbR8.js";var _=e(h(),1),v=g();function y({code:e,title:t}){let r=(0,_.useCallback)(m(function*(){try{yield navigator.clipboard.writeText(e),n.success(`已复制`)}catch(e){n.error(`复制失败`)}}),[e]);return(0,v.jsxs)(`div`,{className:`openapi-demo__code-block`,children:[(0,v.jsxs)(`div`,{className:`openapi-demo__code-head`,children:[t?(0,v.jsx)(p.Text,{type:`secondary`,children:t}):(0,v.jsx)(`span`,{}),(0,v.jsx)(i,{size:`small`,onClick:()=>void r(),children:`复制`})]}),(0,v.jsx)(`pre`,{className:`openapi-demo__pre`,children:e})]})}var b=`api/api-server.yaml`,x=`packages/openapi/openapi.config.ts`,S=`packages/openapi/package.json`,C=`// ${x}
import { defineConfig } from 'openapi-axios-sdk/config';

/** 在 packages/openapi 目录执行 generate 时，cwd 为本目录；apiDir / outDir 相对此处解析 */
export default defineConfig({
  apiDir: '../../api',   // → 仓库根 api/*.yaml
  outDir: 'gen',         // → packages/openapi/gen/
  gitignore: false,
  verbose: false,
});`,w=[{where:`仓库根`,command:`pnpm run generate`,desc:`Turbo 调度 @packages/openapi#generate；改 api/*.yaml 或 openapi.config.ts 后手动执行`},{where:`仓库根`,command:`pnpm exec turbo run generate --filter=@packages/openapi`,desc:`仅生成 OpenAPI SDK，不跑其它包`},{where:`packages/openapi`,command:`pnpm run generate`,desc:`等价于 openapi-gen -c ./openapi.config.ts（须在 packages/openapi 目录下）`},{where:`packages/openapi`,command:`pnpm run typecheck`,desc:`对 gen/ 与包内 TS 做 tsc --noEmit（需已 generate）`},{where:`任意子应用`,command:`pnpm exec turbo run dev --filter=utils...`,desc:`dev/build 依赖 ^generate，启动前会自动先跑本包 generate（见 turbo.json）`}],T=[`本仓库是一个 pnpm workspace + Turborepo 的 Monorepo：多个前端子应用（apps/*）与共享包（packages/*）在同一仓库内协作开发。`,`接口契约统一放在根目录 api/*.yaml；由共享包 @packages/openapi 调用 openapi-axios-sdk 的 openapi-gen 生成 Axios SDK，各子应用通过 workspace 依赖引用，避免每个 app 各自维护一份生成逻辑。`,`后端 api-server（Deno + Hono）实现 api/api-server.yaml 中的路由；本演示页对应该文档与 OpenApiApiServer 工厂，不涉及文件上传或服务端 codegen。`],E=`private/                          # Monorepo 根（pnpm workspace）
├── api/                          # ★ OpenAPI / Swagger 文档（输入）
│   ├── api-server.yaml           #     本页演示的后端 API（Blog + Stock）
│   ├── blog.yaml                 #     其它业务 API 文档
│   └── login.yaml
├── packages/
│   └── openapi/                  # ★ @packages/openapi
│       ├── openapi.config.ts     #     ★ 生成配置（packages/openapi/openapi.config.ts）
│       ├── package.json          #     ★ scripts: generate / typecheck
│       └── gen/                  #     ★ 生成产物（gitignore，pnpm generate 后才有）
│           ├── index.ts          #         聚合 OpenApiBlog、OpenApiApiServer …
│           ├── api-server-gen/   #         单 spec：sdk.gen.ts、types.ts
│           ├── blog-gen/
│           └── login-gen/
├── apps/                         # 微前端子应用（Vite + qiankun）
│   ├── main/                     #     基座，注册子应用
│   ├── utils/                    #     本工具箱；stockServer 使用 OpenApiApiServer
│   ├── blog/                     #     blogServer → OpenApiApiServer
│   └── resume/                   #     示例：OpenApiBlog
├── backend/
│   └── api-server/               #     Deno 实现 api-server.yaml 中的 HTTP 路由
├── turbo.json                    #     dev/build 依赖 ^generate
├── pnpm-workspace.yaml
└── package.json                  #     根脚本：pnpm run generate`,D=[{path:`api/*.yaml`,desc:`OpenAPI 3 文档源；文件名（去后缀）决定工厂名，如 api-server.yaml → OpenApiApiServer`},{path:x,desc:`openapi-gen 唯一配置文件；defineConfig 指定 apiDir=../../api、outDir=gen（路径相对 packages/openapi）`},{path:S,desc:`包脚本：generate → openapi-gen -c ./openapi.config.ts；typecheck → tsc`},{path:`packages/openapi/gen/`,desc:`生成代码目录；修改 yaml 后执行 pnpm run generate 更新`},{path:`packages/openapi/gen/index.ts`,desc:`统一导出各 spec 的 OpenApi<Name> 工厂`},{path:`packages/openapi/gen/*-gen-types`,desc:`仅类型的子路径导出，如 @packages/openapi/api-server-gen-types`},{path:`turbo.json`,desc:`globalDependencies 含 api/**/*.yaml；dev/build 前自动跑 ^generate`},{path:`backend/api-server/`,desc:`实现 api-server.yaml 的后端服务（与 SDK 的 BASE 对应）`}],O=[{path:`apps/utils/src/api/stockServer.ts`,desc:`OpenApiApiServer + api-server-gen-types（持仓成本工具）`},{path:`apps/blog/src/api/blogServer.ts`,desc:`OpenApiApiServer，调用 Blog 相关接口`},{path:`apps/resume/src/utils/request.ts`,desc:`OpenApiBlog，示例另一份 spec`}],k=`OpenApiApiServer`,A=`https://api-server.promisezhangbo.deno.net`,j=[{title:`编写 OpenAPI 文档`,desc:`在仓库 \`${b}\` 中维护路径、operationId、请求/响应 schema。`},{title:`配置生成`,desc:`编辑 \`${x}\`（\`defineConfig\`，\`apiDir\` → 仓库 \`api/\`，\`outDir\` → \`gen/\`）。`},{title:`执行生成`,desc:"仓库根 `pnpm run generate`，或在 `packages/openapi` 下 `pnpm run generate`（见本页「命令说明」）。"},{title:`业务中初始化 SDK`,desc:`从 \`@packages/openapi\` 导入 \`${k}\`，传入 BASE、鉴权等。`},{title:`调用生成的方法`,desc:"方法名与 YAML 中 `operationId` 一致，如 `getStockList`、`createStock`。"}],M=`import { OpenApiApiServer } from '@packages/openapi';

/** 与 apps/utils/src/api/stockServer.ts 相同写法 */
export const apiServer = OpenApiApiServer({
  BASE:
    import.meta.env.VITE_API_SERVER_BASE?.trim() ||
    '${A}',
  WITH_CREDENTIALS: true,
  errorHandling: { reporter: () => {}, debounceMs: 200 },
});`,N=`import type { CreateStockRequest, StockListPage } from '@packages/openapi/api-server-gen-types';
import { apiServer } from './apiServer';

export async function getStockList(params?: {
  page?: number;
  pageSize?: number;
  stock_code?: string;
}): Promise<StockListPage> {
  const { data } = await apiServer.getStockList({ query: params });
  return data ?? { items: [], total: 0, page: 1, pageSize: 10 };
}

export async function createStock(body: CreateStockRequest) {
  const { data } = await apiServer.createStock({ body });
  if (!data) throw new Error('createStock: empty response');
  return data;
}`,P=[{tag:`Blog`,operationId:`getBlogList`,method:`GET`,path:`/getBlogList`,summary:`获取博客列表（分页，可按 name 筛选）`,callSnippet:`const { data } = await apiServer.getBlogList({
  query: { page: 1, pageSize: 10, name: '关键词' },
});
// data: BlogListPage`},{tag:`Blog`,operationId:`getBlog`,method:`GET`,path:`/getBlog`,summary:`按 id 获取单条博客`,callSnippet:`const { data } = await apiServer.getBlog({
  query: { id: 1 },
});
// data: BlogListItem`},{tag:`Blog`,operationId:`updateBlogName`,method:`POST`,path:`/updateBlogName`,summary:`更新博客名称`,callSnippet:`const { data } = await apiServer.updateBlogName({
  body: { id: 1, name: '新名称' },
});
// data: BlogListItem`},{tag:`Stock`,operationId:`getStockList`,method:`GET`,path:`/getStockList`,summary:`持仓成本记录分页列表（可按 stock_code 筛选）`,callSnippet:`const { data } = await apiServer.getStockList({
  query: { page: 1, pageSize: 10, stock_code: '159231' },
});
// data: StockListPage`},{tag:`Stock`,operationId:`getStock`,method:`GET`,path:`/getStock`,summary:`按 id 获取单条持仓记录`,callSnippet:`const { data } = await apiServer.getStock({
  query: { id: 1 },
});
// data: StockRecord`},{tag:`Stock`,operationId:`createStock`,method:`POST`,path:`/createStock`,summary:`新增持仓成本记录（end_cost 由服务端计算）`,callSnippet:`const { data } = await apiServer.createStock({
  body: {
    stock_code: '159231',
    stock_name: '通用航空ETF华宝',
    init_cost: 1.042,
    init_num: 1100,
    add_cost: 1.007,
    add_num: 1000,
    commission: 5,
  },
});
// data: StockRecord`},{tag:`Stock`,operationId:`deleteStock`,method:`POST`,path:`/deleteStock`,summary:`删除持仓成本记录`,callSnippet:`const { data } = await apiServer.deleteStock({
  body: { id: 1 },
});
// data: { ok: true, id: number }`}];function F(){return(0,v.jsxs)(`div`,{className:`openapi-demo__stack`,children:[(0,v.jsx)(a,{title:`Monorepo 概览`,size:`small`,children:T.map(e=>(0,v.jsx)(p.Paragraph,{type:`secondary`,className:`openapi-demo__para`,children:e},e))}),(0,v.jsxs)(a,{title:`配置文件 openapi.config.ts`,size:`small`,extra:(0,v.jsx)(p.Text,{code:!0,children:x}),children:[(0,v.jsxs)(p.Paragraph,{type:`secondary`,className:`openapi-demo__para`,children:[`生成 CLI `,(0,v.jsx)(p.Text,{code:!0,children:`openapi-gen`}),` 读取的配置文件，位于`,` `,(0,v.jsx)(p.Text,{strong:!0,children:`packages/openapi`}),` 包根目录（非仓库根、非各子应用内）。 修改 `,(0,v.jsx)(p.Text,{code:!0,children:`apiDir`}),` / `,(0,v.jsx)(p.Text,{code:!0,children:`outDir`}),` `,`后需重新执行 generate。`]}),(0,v.jsx)(y,{code:C,title:x})]}),(0,v.jsxs)(a,{title:`package.json 命令`,size:`small`,extra:(0,v.jsx)(p.Text,{code:!0,children:S}),children:[(0,v.jsxs)(p.Paragraph,{type:`secondary`,className:`openapi-demo__para`,children:[`包内 scripts 通过 `,(0,v.jsx)(p.Text,{code:!0,children:`-c ./openapi.config.ts`}),` 指定配置；仓库根`,` `,(0,v.jsx)(p.Text,{code:!0,children:`package.json`}),` 的 `,(0,v.jsx)(p.Text,{code:!0,children:`generate`}),` `,`经 Turbo 转调本包。`]}),(0,v.jsx)(t,{rowKey:e=>`${e.where}-${e.command}`,size:`small`,pagination:!1,columns:[{title:`执行位置`,dataIndex:`where`,width:140},{title:`命令`,dataIndex:`command`,width:320,render:e=>(0,v.jsx)(p.Text,{code:!0,children:e})},{title:`说明`,dataIndex:`desc`}],dataSource:w,scroll:{x:720}})]}),(0,v.jsxs)(a,{title:`OpenAPI 相关目录（精简）`,size:`small`,children:[(0,v.jsx)(y,{code:E,title:`目录树`}),(0,v.jsx)(p.Paragraph,{type:`secondary`,className:`openapi-demo__tree-hint`,children:`标记 ★ 的路径与 openapi-axios-sdk 生成、消费直接相关；gen/ 由 pnpm run generate 产出，通常不提交 Git。`})]}),(0,v.jsx)(a,{title:`关键文件说明`,size:`small`,children:(0,v.jsx)(t,{rowKey:`path`,size:`small`,pagination:!1,columns:[{title:`路径`,dataIndex:`path`,width:300,render:e=>(0,v.jsx)(p.Text,{code:!0,children:e})},{title:`说明`,dataIndex:`desc`}],dataSource:D,scroll:{x:560}})}),(0,v.jsx)(a,{title:`子应用中的引用示例`,size:`small`,children:(0,v.jsx)(`ul`,{className:`openapi-demo__consumer-list`,children:O.map(e=>(0,v.jsxs)(`li`,{children:[(0,v.jsx)(p.Text,{code:!0,children:e.path}),(0,v.jsxs)(p.Text,{type:`secondary`,children:[` — `,e.desc]})]},e.path))})})]})}var I={GET:`blue`,POST:`green`};function L(){return(0,v.jsx)(`div`,{className:`utils-page openapi-demo`,children:(0,v.jsxs)(`div`,{className:`utils-page__inner`,children:[(0,v.jsxs)(d,{to:`/utils/list`,className:`openapi-demo__back`,children:[(0,v.jsx)(u,{}),` 返回工具列表`]}),(0,v.jsxs)(p.Title,{level:4,className:`utils-page__title`,children:[(0,v.jsx)(l,{className:`openapi-demo__title-icon`}),`OpenAPI SDK 使用说明`]}),(0,v.jsxs)(p.Paragraph,{type:`secondary`,className:`utils-page__subtitle`,children:[`基于本仓库 `,(0,v.jsx)(p.Text,{code:!0,children:b}),` 与`,` `,(0,v.jsx)(p.Text,{code:!0,children:`openapi-axios-sdk`}),` 生成的`,` `,(0,v.jsx)(p.Text,{code:!0,children:k}),`。本页仅展示代码示例，不会发起真实请求。`]}),(0,v.jsx)(c,{type:`info`,showIcon:!0,className:`openapi-demo__alert`,message:`文档与代码同步方式`,description:(0,v.jsxs)(v.Fragment,{children:[`修改 YAML 后执行 `,(0,v.jsx)(p.Text,{code:!0,children:`pnpm run generate`}),`，业务代码从`,` `,(0,v.jsx)(p.Text,{code:!0,children:`@packages/openapi`}),` 导入。生产环境 BASE 默认为`,` `,(0,v.jsx)(p.Text,{code:!0,children:A}),`，本地可在`,` `,(0,v.jsx)(p.Text,{code:!0,children:`apps/utils/.env.local`}),` 设置`,` `,(0,v.jsx)(p.Text,{code:!0,children:`VITE_API_SERVER_BASE`}),`。`]})}),(0,v.jsx)(r,{className:`openapi-demo__tabs`,items:[{key:`project`,label:`项目说明`,children:(0,v.jsx)(F,{})},{key:`workflow`,label:`接入步骤`,children:(0,v.jsx)(a,{children:(0,v.jsx)(f,{direction:`vertical`,size:`small`,current:-1,items:j.map(e=>({title:e.title,description:e.desc}))})})},{key:`sdk`,label:`SDK 示例`,children:(0,v.jsxs)(`div`,{className:`openapi-demo__stack`,children:[(0,v.jsx)(a,{title:`1. 初始化客户端`,size:`small`,children:(0,v.jsx)(y,{code:M,title:`OpenApiApiServer`})}),(0,v.jsxs)(a,{title:`2. 业务封装（可选）`,size:`small`,children:[(0,v.jsxs)(p.Paragraph,{type:`secondary`,children:[`可参考 `,(0,v.jsx)(p.Text,{code:!0,children:`apps/utils/src/api/stockServer.ts`}),` `,`对生成方法做薄封装，统一处理 `,(0,v.jsx)(p.Text,{code:!0,children:`data`}),` 为空等情况。`]}),(0,v.jsx)(y,{code:N,title:`封装示例`})]})]})},{key:`ops`,label:`接口与调用示例`,children:(0,v.jsxs)(`div`,{className:`openapi-demo__stack`,children:[(0,v.jsx)(a,{title:`接口一览`,size:`small`,children:(0,v.jsx)(t,{rowKey:`operationId`,size:`small`,pagination:!1,columns:[{title:`模块`,dataIndex:`tag`,width:72,render:e=>(0,v.jsx)(s,{children:e})},{title:`方法`,dataIndex:`method`,width:72,render:e=>(0,v.jsx)(s,{color:I[e],children:e})},{title:`路径`,dataIndex:`path`,width:140,ellipsis:!0},{title:`operationId`,dataIndex:`operationId`,width:120},{title:`说明`,dataIndex:`summary`,ellipsis:!0}],dataSource:P,scroll:{x:640}})}),(0,v.jsx)(a,{title:`按 operationId 调用（复制即用）`,size:`small`,children:(0,v.jsx)(o,{accordion:!0,items:P.map(e=>({key:e.operationId,label:(0,v.jsxs)(`span`,{className:`openapi-demo__collapse-label`,children:[(0,v.jsx)(s,{color:I[e.method],children:e.method}),(0,v.jsx)(p.Text,{code:!0,children:e.path}),(0,v.jsxs)(p.Text,{type:`secondary`,children:[` — `,e.summary]})]}),children:(0,v.jsx)(y,{code:`// 假定已执行：const apiServer = OpenApiApiServer({ ... });\n\n${e.callSnippet}`,title:e.operationId})}))})})]})}]})]})})}export{L as default};