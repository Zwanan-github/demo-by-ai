# JEECG Boot Backend for PageAgent Demo

这是 `projects/jeecgboot-page-agent-fullstack/frontend/` 前端 demo 对应的 JEECG Boot 后端。

## 目录关系

```text
projects/
  jeecgboot-page-agent-fullstack/
    frontend/  # Vue3 前端，已顶层挂载 PageAgent Web Chat
    backend/   # Spring Boot 后端，提供登录、菜单、业务接口
```

## 推荐启动方式一：Docker Compose

后端工程自带 `docker-compose.yml`，包含：

- MySQL，端口 `13306:3306`
- Redis
- PgVector
- JEECG Boot System 后端，端口 `8080`

启动：

```bash
cd projects/jeecgboot-page-agent-fullstack/backend
docker compose up -d --build
```

后端地址：

```text
http://localhost:8080/jeecg-boot
```

## 推荐启动方式二：本地 Maven + Docker MySQL/Redis

先启动基础依赖：

```bash
cd projects/jeecgboot-page-agent-fullstack/backend
docker compose up -d jeecg-boot-mysql jeecg-boot-redis jeecg-boot-pgvector
```

然后启动单体后端：

```bash
mvn -pl jeecg-module-system/jeecg-system-start -am spring-boot:run -Dspring-boot.run.profiles=dev
```

注意：`application-dev.yml` 默认连接：

```text
MySQL: 127.0.0.1:3306 / jeecg-boot
Redis: 127.0.0.1:6379
```

如果使用本目录 docker compose 的 MySQL 端口 `13306`，需要改配置或做端口映射调整。

## 前端代理

前端 demo：

```text
projects/jeecgboot-page-agent-fullstack/frontend/
```

JEECG Boot Vue3 前端默认通过 Vite proxy 访问后端。一般启动后端 `8080` 后，再启动前端：

```bash
cd projects/jeecgboot-page-agent-fullstack/frontend
pnpm install
cp .env.page-agent.example .env.local
# 在 .env.local 填 VITE_PAGE_AGENT_API_KEY
pnpm dev
```

然后登录系统，右下角会出现 `AI PageAgent`。

## PageAgent 测试提示词

```text
打开系统管理菜单，进入用户管理页面
```

```text
帮我点击当前页面的查询按钮
```

```text
找到新增按钮并点击；如果要保存，请先问我确认
```

## 说明

PageAgent 是挂在前端 `src/App.vue` 顶层的浮动组件，后端只负责让 JEECG Boot 页面、登录态、菜单和业务接口正常工作。
