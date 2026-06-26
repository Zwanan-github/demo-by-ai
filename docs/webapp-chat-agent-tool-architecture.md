# 网页应用内 Chat Agent 接入页面控制工具方案

> 日期：2026-06-26  
> 场景：你们自己的 Web App 内部有一个 Chat Agent，用户通过自然语言让 Agent 操作当前应用页面。  
> Demo：`demos/webapp-chat-agent-react/`

## 1. 目标场景

目标不是控制用户整台电脑，也不是控制任意浏览器页面，而是：

```text
用户正在使用我们的 Web App
  ↓
页面中有一个 Chat Agent
  ↓
用户输入自然语言任务
  ↓
Agent 操作当前应用页面、路由、表单和业务动作
```

典型任务：

```text
切换到报表页
```

```text
先去新建客户页面，创建一个客户，姓名张三，公司阿里巴巴，城市杭州，等级VIP，然后保存
```

## 2. 推荐架构

推荐采用“双策略”架构：

```text
Web App, React/Vue
  ├─ Router 页面
  │   ├─ /customers
  │   ├─ /customers/new
  │   └─ /reports
  ├─ Chat Agent UI
  ├─ Strategy A：自定义工具调用
  │   ├─ observe_page
  │   ├─ navigate_to
  │   ├─ fill_field
  │   ├─ select_option
  │   ├─ click_button
  │   └─ extract_state
  ├─ Strategy B：PageAgent GUI Agent
  │   └─ agent.execute(userTask)
  └─ Guardrails
      ├─ 用户确认
      ├─ 权限判断
      ├─ 敏感字段脱敏
      └─ 操作日志
```

## 3. 为什么不是优先 browser-use

browser-use 是很好的浏览器自动化框架，但它不是本场景第一选择。

原因：

1. **运行位置不同**  
   我们的 Agent 在网页应用内部，browser-use 通常在页面外部的 Python/worker/浏览器自动化环境里。

2. **当前会话不同**  
   用户已经登录并停留在当前 Web App 中；browser-use 需要额外处理登录态、Cookie、浏览器 profile、租户上下文。

3. **产品体验不同**  
   页面内 Chat Agent 应直接操作当前页面；browser-use 更像外部机器人或后台自动化。

4. **部署复杂度不同**  
   browser-use 需要浏览器运行环境、任务执行器、并发管理、失败重试等；PageAgent 和自定义工具可以直接从前端起步。

5. **安全边界不同**  
   Web App 内工具可以做到最小权限；browser-use 的浏览器级自动化边界更大。

因此，本项目当前应优先：

```text
自定义工具调用 + PageAgent
```

而不是：

```text
browser-use 主导当前 Web App 操作
```

## 4. PageAgent 在本方案中的角色

PageAgent 适合承担“通用页面 GUI Agent”能力。

它能做：

- 观察当前页面 DOM；
- 根据自然语言决定点击、输入、选择、滚动；
- 操作当前 Web App 中的表单、按钮、导航链接；
- 作为未显式定义工具时的 fallback。

在 demo 中，PageAgent 模式大致是：

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

## 5. 自定义工具在本方案中的角色

自定义工具适合承担“稳定、可控、可审计的业务动作”。

当前 demo 工具：

```text
observe_page
navigate_to
fill_field
select_option
click_button
extract_state
```

其中 `navigate_to` 负责真实 React Router 路由跳转：

```json
{ "tool": "navigate_to", "args": { "page": "list" } }
```

映射：

```text
list    -> /customers
create  -> /customers/new
reports -> /reports
```

相比 PageAgent 纯点击，自定义工具的优势是：

- 不依赖按钮文案或 DOM 结构；
- 可以做参数校验；
- 可以做权限控制；
- 可以记录审计日志；
- 对关键业务动作更安全。

## 6. 两种策略对比

| 项目 | 自定义工具调用 | PageAgent |
|---|---|---|
| 控制方式 | LLM 输出结构化工具 JSON | LLM 通过 PageAgent 观察并操作 DOM |
| 路由切换 | 调用 `navigate_to`，内部 `navigate()` | 点击页面导航链接 |
| 表单填写 | 调用 `fill_field/select_option` | 找到输入框并输入 |
| 稳定性 | 高 | 中高，取决于 DOM 可读性 |
| 泛化能力 | 低到中，需要预定义工具 | 高，能处理未定义 UI |
| 安全性 | 高，易做权限/确认 | 需要额外 guardrails |
| 适合动作 | 保存、提交、审批、删除等关键动作 | 点击、填写、选择、低风险页面操作 |
| 生产建议 | 必须保留 | 作为增强能力和 fallback |

## 7. 当前 Demo 说明

目录：

```text
demos/webapp-chat-agent-react/
```

技术栈：

- React
- TypeScript
- Vite
- React Router
- page-agent
- OpenAI-compatible API

路由：

```text
/customers        客户列表
/customers/new    新建客户
/reports          数据报表
```

运行：

```bash
cd demos/webapp-chat-agent-react
npm install
npm run dev
```

访问：

```text
http://localhost:18081/
```

默认会跳转到：

```text
/customers
```

## 8. 测试用例

### 8.1 自定义工具模式

打开执行模式：

```text
自定义工具调用，对照组
```

测试：

```text
切换到报表页
```

期望：调用 `navigate_to({ page: "reports" })`，URL 变为 `/reports`。

测试：

```text
先去新建客户页面，创建一个客户，姓名张三，公司阿里巴巴，城市杭州，等级VIP，然后保存
```

期望：

```text
navigate_to(create)
fill_field(customerName, 张三)
fill_field(company, 阿里巴巴)
select_option(city, 杭州)
select_option(level, VIP)
click_button(save)
```

### 8.2 PageAgent 模式

打开执行模式：

```text
PageAgent 库，页面 GUI Agent
```

测试：

```text
请点击数据报表导航，查看报表内容
```

期望：PageAgent 点击顶部“数据报表”链接，URL 变为 `/reports`。

测试：

```text
从客户列表切换到新建客户页面，然后填写张三客户并保存
```

期望：PageAgent 点击“新建客户”导航，填写表单并保存。

## 9. 生产化建议

### 9.1 工具分层

建议分三层：

```text
业务 API 工具：createCustomer、submitApproval、deleteRecord
页面工具：navigate_to、fill_field、select_option
GUI Agent：PageAgent 处理通用点击/输入
```

### 9.2 高风险动作确认

必须要求用户确认的动作：

- 删除；
- 付款；
- 发邮件/发消息；
- 提交不可逆审批；
- 修改权限；
- 导出敏感数据。

### 9.3 不要在前端暴露真实 API Key

当前 demo 为了方便测试，支持 `.env.local` 写入 API Key。正式产品应改成：

```text
前端 Chat UI -> 自家后端 Agent API -> LLM Provider
```

避免 API Key 暴露给浏览器用户。

### 9.4 PageAgent 安全限制

建议生产环境：

- 关闭或限制高风险 JS 执行工具；
- 对发送给 LLM 的 DOM 内容做脱敏；
- 增加操作 trace；
- 提供用户中断/接管按钮；
- 对关键页面使用自定义业务工具兜底。

## 10. 与调研文档关系

更完整的 PageAgent 与 browser-use 对比见：

```text
research/browser-control-pageagent-browseruse.md
```
