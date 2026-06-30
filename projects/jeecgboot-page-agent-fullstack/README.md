# JEECG Boot PageAgent Full-stack Demo

这是一个完整的 JEECG Boot + PageAgent Web Chat demo，包含前端和后端：

```text
projects/jeecgboot-page-agent-fullstack/
  frontend/   # JEECG Boot Vue3 前端，已在 App.vue 顶层挂载 PageAgent Web Chat
  backend/    # JEECG Boot Spring Boot 后端，提供登录、菜单、业务接口
```

## 1. 启动后端

推荐使用 Docker Compose：

```bash
cd projects/jeecgboot-page-agent-fullstack/backend
docker compose up -d --build
```

后端默认地址：

```text
http://localhost:8080/jeecg-boot
```

## 2. 启动前端

```bash
cd projects/jeecgboot-page-agent-fullstack/frontend
pnpm install
cp .env.page-agent.example .env.local
# 编辑 .env.local，填写 VITE_PAGE_AGENT_API_KEY
pnpm dev
```

打开 Vite 输出的前端地址，登录后右下角会出现 `AI PageAgent` 悬浮入口。

## 3. 测试 Prompt

```text
打开系统管理菜单，进入用户管理页面
```

```text
帮我点击当前页面的查询按钮
```

```text
找到新增按钮并点击；如果要保存，请先问我确认
```

## 4. 关键改动

前端顶层：

```text
frontend/src/App.vue
```

新增：

```vue
<RouterView />
<PageAgentWebChat />
```

PageAgent 组件：

```text
frontend/src/components/PageAgentChat/PageAgentWebChat.vue
```

## 5. 注意

- Demo 中前端可以直连 OpenAI-compatible API，生产环境建议改成后端代理。
- PageAgent 会观察当前页面 DOM，生产环境需要进一步脱敏和操作审计。
- 保存、删除、提交、授权、导出等高风险动作必须先让用户确认。

## 6. 多应用门户跳转测试页

已新增 PageAgent 多应用门户边界测试页面：

```text
http://localhost:3100/page-agent-portal
```

包含四种场景：

- **SPA 内路由切换**：`/page-agent-app-a`、`/page-agent-app-b`，PageAgent 挂在 `App.vue` 顶层，不会卸载，可连续操作。
- **同源 iframe 子应用**：`/page-agent-iframe-shell` 加载 `/page-agent-iframe-app.html`，用于测试同源 iframe 的可操作边界。
- **整页跳转**：跳到 `/page-agent-external-app.html`，Vue App 和 PageAgent 会卸载，通常只能完成点击跳转这一步。
- **新 Tab 打开**：目标页在新 tab 中打开，当前页面内的 PageAgent 不能直接控制新 tab。

推荐测试 Prompt：

```text
打开 PageAgent 门户测试页，依次进入 SPA 应用、iframe 应用和整页跳转应用，告诉我每一步是否还能继续操作页面。
```
