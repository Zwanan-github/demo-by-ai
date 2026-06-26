# WebApp Chat Agent React Demo

React + Vite + React Router 版本的“网页应用内 Chat Agent 控制当前应用”demo。

这个 demo 用于对比两种策略：

| 模式 | 说明 | 适合 |
|---|---|---|
| 自定义工具调用，对照组 | 由应用显式暴露 `observe_page`、`navigate_to`、`fill_field`、`select_option`、`click_button`、`extract_state` | 生产业务动作、强可控流程 |
| PageAgent 库，页面 GUI Agent | 直接使用 `page-agent` 观察并操作当前页面 DOM | 泛化页面操作、快速验证页面 Copilot |

建议产品化时组合使用：

```text
自定义业务工具：保存、提交、删除、审批等关键动作
PageAgent：导航、点击、填写、选择等通用页面操作和 fallback
```


## 代码分包结构

```text
src/
  main.tsx                         # 应用入口
  AppShell.tsx                     # 顶层状态和策略编排
  constants.ts                     # 路由、默认模型、示例数据
  types.ts                         # 共享类型
  components/
    AppRoutes.tsx                  # React Router 路由和导航
    ChatAgentPanel.tsx             # 右侧 Chat Agent 面板
  pages/
    CustomerList.tsx               # 客户列表页
    CustomerCreate.tsx             # 新建客户页
    Reports.tsx                    # 数据报表页
  strategies/
    custom-tools/                  # 策略 A：自定义工具调用
      planner.ts                   # mock planner 和 prompt builder
      llmPlanner.ts                # OpenAI-compatible planner 请求
      tools.ts                     # 工具注册和动作执行
    page-agent/                    # 策略 B：PageAgent
      runPageAgent.ts              # PageAgent 初始化和执行
  utils/
    id.ts
```

## 技术栈

- React
- TypeScript
- Vite
- React Router
- page-agent
- OpenAI-compatible `/chat/completions`

## 路由

```text
/customers        客户列表
/customers/new    新建客户
/reports          数据报表
```

## 默认 API 配置

```text
Base URL: https://napi.zwanan.top/v1
Model: deepseek-v3.2
```

API Key 不建议提交到仓库。可以在页面上输入，或本地创建 `.env.local`：

```bash
cp .env.example .env.local
# 编辑 .env.local：
# VITE_OPENAI_API_KEY=sk-...
```

> 注意：前端直连 LLM API 会暴露 Key，正式产品应改成后端代理接口。

## 运行

```bash
cd demos/webapp-chat-agent-react
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:18081
```

## 测试自定义工具模式

选择：

```text
自定义工具调用，对照组
```

输入：

```text
切换到报表页
```

或：

```text
先去新建客户页面，创建一个客户，姓名张三，公司阿里巴巴，城市杭州，等级VIP，然后保存
```

自定义工具模式下，路由切换通过：

```json
{ "tool": "navigate_to", "args": { "page": "reports" } }
```

映射：

```text
list    -> /customers
create  -> /customers/new
reports -> /reports
```

## 测试 PageAgent 模式

选择：

```text
PageAgent 库，页面 GUI Agent
```

输入：

```text
请点击数据报表导航，查看报表内容
```

或：

```text
从客户列表切换到新建客户页面，然后填写张三客户并保存
```

PageAgent 模式下，代码大致是：

```ts
const agent = new PageAgent({
  baseURL,
  model,
  apiKey,
  language: 'zh-CN',
  maxSteps: 12,
  promptForNextTask: false,
})

await agent.execute(userText)
```

PageAgent 会观察 DOM，并点击导航链接、输入表单、选择下拉框。

## 相关文档

- 调研对比：`../../research/browser-control-pageagent-browseruse.md`
- 方案设计：`../../docs/webapp-chat-agent-tool-architecture.md`
