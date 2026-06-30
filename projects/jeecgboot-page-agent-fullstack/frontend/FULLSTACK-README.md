# JEECG Boot PageAgent Full-stack Demo

这个 demo 现在放在同一个完整工程目录下，由两部分组成：

```text
projects/jeecgboot-page-agent-fullstack/
  frontend/  # 前端 Vue3 + PageAgent Web Chat
  backend/   # JEECG Boot Spring Boot 后端
```

## 1. 启动后端

推荐直接用 Docker Compose：

```bash
cd projects/jeecgboot-page-agent-fullstack/backend
docker compose up -d --build
```

后端默认：

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

打开 Vite 输出的前端地址，登录后右下角会看到 `AI PageAgent` 悬浮按钮。

## 3. PageAgent 配置

`.env.local` 示例：

```bash
VITE_PAGE_AGENT_ENABLED=true
VITE_PAGE_AGENT_BASE_URL=https://napi.zwanan.top/v1
VITE_PAGE_AGENT_MODEL=deepseek-v3.2
VITE_PAGE_AGENT_API_KEY=你的 key
VITE_PAGE_AGENT_MAX_STEPS=12
```

## 4. 测试方式

登录 JEECG Boot 后，可以测试：

```text
打开系统管理菜单，进入用户管理页面
```

```text
帮我点击当前页面的查询按钮
```

```text
找到新增按钮并点击；如果要保存，请先问我确认
```

## 5. 注意事项

- 前端直连 LLM API 只适合 demo，生产应使用后端代理。
- PageAgent 会观察当前页面 DOM，生产需要进一步脱敏。
- 保存、删除、提交、授权、导出等高风险动作必须要求用户确认。
