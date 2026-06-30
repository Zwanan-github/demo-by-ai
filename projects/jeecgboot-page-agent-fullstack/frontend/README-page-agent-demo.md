# JEECG Boot Vue3 + PageAgent Web Chat Demo

> 基于 JEECG Boot Vue3 前端脚手架，在最顶层 `src/App.vue` 挂载 PageAgent Web Chat，用于测试“Web 应用内 Chat Agent 控制当前业务系统页面”。

## 改动点

### 1. 顶层挂载

文件：`src/App.vue`

```vue
<RouterView />
<PageAgentWebChat />
```

这样 PageAgent Web Chat 会跟随整个 JEECG Boot 前端应用存在，不依赖某个具体页面或路由。

### 2. 新增组件

文件：`src/components/PageAgentChat/PageAgentWebChat.vue`

能力：

- 浮动 PageAgent 聊天入口；
- 可配置 OpenAI-compatible `Base URL / Model / API Key / Max Steps`；
- 调用 `new PageAgent(...).execute(userTask)` 操作当前页面；
- 支持停止当前任务；
- 对发送给模型的页面内容做基础敏感字段脱敏；
- 高风险动作通过 prompt 要求 PageAgent 先询问用户确认。

### 3. 新增依赖

`package.json`：

```json
{
  "page-agent": "^1.10.0",
  "zod": "^4.4.3"
}
```

并已更新 `pnpm-lock.yaml`。

## 环境变量

示例文件：`.env.page-agent.example`

```bash
VITE_PAGE_AGENT_ENABLED=true
VITE_PAGE_AGENT_BASE_URL=https://napi.zwanan.top/v1
VITE_PAGE_AGENT_MODEL=deepseek-v3.2
VITE_PAGE_AGENT_API_KEY=
VITE_PAGE_AGENT_MAX_STEPS=12
```

本地测试可以复制：

```bash
cp .env.page-agent.example .env.local
```

然后在 `.env.local` 里填入真实 API Key。

> 注意：前端直连 LLM API 会暴露 Key。生产环境建议改成后端代理：前端 -> 自家 Agent API -> LLM Provider。

## 运行

```bash
cd projects/jeecgboot-page-agent-fullstack/frontend
pnpm install
pnpm dev
```

启动后打开 Vite 地址，右下角会出现 `AI PageAgent` 悬浮按钮。

## 测试提示词

可以登录或进入任意 JEECG Boot 页面后测试：

```text
帮我点击当前页面的查询按钮
```

```text
打开系统管理菜单，进入用户管理页面
```

```text
在当前页面查找新增按钮并点击，但如果要保存或提交请先问我确认
```

## 与之前 React Demo 的关系

之前的 `demos/webapp-chat-agent-react/` 是轻量对照 demo：

- 自定义工具调用策略；
- PageAgent 策略；
- React Router 多页面。

本 demo 是把 PageAgent 集成进真实 JEECG Boot 前端脚手架，验证在复杂后台系统里的页面控制能力。

## 为什么挂在 App.vue

`App.vue` 是 JEECG Boot 前端的顶层容器：

```text
ConfigProvider
  AppProvider
    RouterView
```

PageAgent Web Chat 放在这里可以：

- 覆盖所有路由页面；
- 使用当前用户登录态和当前页面 DOM；
- 不影响具体业务页面代码；
- 适合验证“应用级 Copilot”。

## 安全建议

生产化前建议：

- API Key 不进浏览器，走后端代理；
- 对 DOM 内容进一步脱敏；
- 对保存、删除、提交、授权、导出等动作强制用户确认；
- 记录 PageAgent 操作 trace；
- 限制或关闭高风险 JS 执行能力；
- 在业务关键动作上优先使用显式业务工具，而不是纯 DOM 点击。

## 多应用门户跳转边界测试

访问：

```text
/page-agent-portal
```

该页面用于验证：

1. SPA 内路由切换：PageAgent 可持续操作；
2. 同源 iframe：父页面 Agent 仍存在，同源 iframe 可测试 DOM 访问能力；
3. 整页跳转：当前 PageAgent 会卸载，只能做到点击跳转；
4. 新 Tab：当前页面 Agent 不能直接控制新 tab。
