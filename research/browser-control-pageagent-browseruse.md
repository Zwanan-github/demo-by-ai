# WebApp 内 Chat Agent 技术调研：PageAgent 与 browser-use 对比

> 日期：2026-06-26  
> 项目：`demo-by-ai`  
> 目标：评估“我们自己的网页应用里内嵌 Chat Agent，Agent 接入工具操作当前 Web App”的技术方案，并说明为什么该场景下 PageAgent 比 browser-use 更适合。

## 1. 场景定义

本调研讨论的不是“浏览器插件侧边栏控制任意网页”，也不是“云端/本地 Playwright 控制独立浏览器”。真正目标是：

```text
我们自己的 Web App
  ├─ 业务页面，React/Vue/普通 Web 均可
  ├─ 页面内 Chat Agent
  ├─ Agent 可调用页面工具或 DOM/GUI Agent
  └─ 用户用自然语言让 Agent 操作当前应用
```

典型任务：

- “帮我新建一个客户，姓名张三，公司阿里巴巴，城市杭州，然后保存。”
- “切换到报表页，看看本月新增客户数。”
- “打开审批页面，把这个字段改成重要客户。”

因此，Agent 的核心上下文是**当前 Web App 的页面、组件状态、路由和业务动作**，而不是整个互联网浏览器环境。

## 2. 结论先行

在这个场景下，推荐优先级是：

```text
第一优先级：自定义业务工具 / 页面工具
第二优先级：PageAgent 这类页面内 GUI Agent
第三优先级：浏览器插件
第四优先级：browser-use / Playwright 外部自动化
```

一句话结论：

> **PageAgent 比 browser-use 更适合“自家 Web App 内 Chat Agent 控制当前页面”的场景，因为 PageAgent 是页面内 JS GUI Agent；browser-use 是外部浏览器自动化框架。**

更具体地说：

- PageAgent 可以直接以 npm 包形式集成到 Web App 中，由页面内 JS 观察和操作当前页面。
- browser-use 更适合 Python/外部进程/云端或本地 worker 控制一个浏览器会话，做跨站自动化、后台任务、数据采集和测试。
- 自家 Web App 如果能显式暴露业务工具，稳定性和安全性会进一步优于纯 DOM 点击。

## 3. PageAgent 调研

### 3.1 官方定位

PageAgent 官方 README 的定位是：

> “The GUI Agent Living in Your Webpage. Control web interfaces with natural language.”

也就是“住在网页里的 GUI Agent”，用于通过自然语言控制 Web 界面。官方特性也强调：不需要 browser extension、Python 或 headless browser，直接在网页内运行 JavaScript；通过文本化 DOM 操作，不依赖截图或多模态模型；支持 npm 安装和 `new PageAgent(...)` 后执行任务。  
来源：Alibaba PageAgent GitHub: https://github.com/alibaba/page-agent

### 3.2 技术特征

PageAgent 的关键特征：

- **运行位置**：页面内，前端 JS/TS runtime。
- **集成方式**：`npm install page-agent` 或 script 方式引入。
- **控制对象**：当前网页 DOM、交互元素、表单、按钮、下拉框等。
- **模型接入**：支持 OpenAI-compatible `baseURL / model / apiKey` 配置。
- **感知方式**：以文本化 DOM/页面结构为主，不要求截图或视觉模型。
- **任务方式**：`agent.execute('自然语言任务')`，内部执行 observe → plan → act 循环。

### 3.3 适合本项目的原因

PageAgent 与本项目目标高度匹配：

1. **同运行环境**  
   我们的 Chat Agent 就在 Web App 里，PageAgent 也在 Web App 里，不需要额外浏览器驱动、Python 服务或远程浏览器。

2. **同用户会话**  
   PageAgent 使用用户当前页面、当前登录态、当前路由、当前组件渲染结果。无需把 Cookie、登录态或浏览器 profile 同步到外部 worker。

3. **集成成本低**  
   对 React/Vue 应用来说，直接 npm 安装即可，不需要安装 Playwright、Chromium、browser daemon、队列系统等。

4. **产品体验自然**  
   Chat UI 与业务页面同屏，Agent 的动作直接发生在用户眼前，用户可以随时接管。

5. **更符合前端产品化**  
   如果目标是做 SaaS/ERP/CRM/Admin Copilot，PageAgent 的页面内模式更贴近产品形态。

6. **可与业务工具组合**  
   PageAgent 负责低风险页面操作；保存、删除、提交、审批等关键动作仍可走应用自定义工具和确认机制。

### 3.4 局限

PageAgent 也不是万能的：

- 默认更适合控制当前 Web App，不适合跨任意网站大规模自动化。
- 复杂 iframe、Shadow DOM、Canvas、验证码、富文本编辑器可能需要额外适配。
- 如果启用执行 JS 类能力，需要额外安全评估；本 demo 构建时也能看到其 page-controller 内部存在 direct eval warning。
- 对关键业务动作，仍建议走显式业务工具，而不是让模型纯点击。

## 4. browser-use 调研

### 4.1 官方定位

browser-use 官方 GitHub 描述是让网站对 AI Agent 可访问，并让在线任务自动化更容易。其项目主题包含 Python、browser automation、Playwright、AI agents 等。  
来源：browser-use GitHub: https://github.com/browser-use/browser-use

这说明 browser-use 的核心定位是**外部浏览器自动化**，而不是“嵌入某个 Web App 内部的前端组件”。

### 4.2 技术特征

browser-use 的典型特征：

- **运行位置**：Web 页面外部，通常是 Python 进程、CLI、本地或云端 worker。
- **控制对象**：浏览器实例/浏览器会话，可跨网站、跨页面执行任务。
- **底层方向**：浏览器自动化、Playwright/browser harness/profile 等。
- **适用任务**：跨站资料收集、自动登录后操作、网页自动化测试、后台爬取、长流程任务。
- **部署诉求**：需要管理浏览器运行环境、profile、代理、并发、风控、验证码、任务队列等。

### 4.3 browser-use 的优势

browser-use 在以下场景更合适：

- Agent 需要访问任意网站，而不是只操作自家 Web App。
- 需要后台执行任务，用户不一定在前台看着。
- 需要跨站搜索、采集、比价、测试、批量自动化。
- Python 生态集成更重要，比如任务队列、数据库、爬虫、LangChain/MCP、Playwright 测试。
- 需要独立浏览器 profile 或云端浏览器环境。

### 4.4 为什么它不是本场景第一选择

对“Web App 内 Chat Agent 控制当前应用”来说，browser-use 会带来额外复杂度：

1. **运行环境错位**  
   Chat Agent 在前端页面里，browser-use 在页面外部。要联通两者，需要额外后端/worker/浏览器会话管理。

2. **用户会话同步复杂**  
   用户已经在当前浏览器登录了自家系统，但 browser-use 可能控制的是另一个浏览器实例。登录态、Cookie、权限、租户上下文都要同步或重建。

3. **产品体验不如页面内直观**  
   用户在页面内聊天，期望当前页面被操作。外部浏览器自动化更像后台机器人，不像内嵌 Copilot。

4. **部署成本更高**  
   需要浏览器二进制、驱动、执行环境、队列、并发隔离、日志、重试、反自动化处理等。

5. **安全边界更大**  
   browser-use 可以控制更广泛的浏览器行为，能力强但也意味着权限和风控面更大。自家 Web App 内 Copilot 应优先最小权限。

## 5. PageAgent 与 browser-use 核心区别

| 维度 | PageAgent | browser-use |
|---|---|---|
| 核心定位 | 页面内 GUI Agent / Web App Copilot | 外部浏览器自动化 Agent |
| 运行位置 | 当前网页内 JavaScript | 页面外 Python/worker/浏览器 harness |
| 主要集成 | npm/script 接入 Web App | Python/CLI/云端/本地自动化环境 |
| 操作对象 | 当前页面 DOM 与 UI | 浏览器会话，可跨站、跨 tab、跨页面 |
| 用户会话 | 直接使用当前页面上下文 | 需要管理或同步浏览器 profile/登录态 |
| 产品体验 | 用户在当前 App 内聊天并看见操作 | 更偏后台任务或外部自动化 |
| 部署成本 | 低，前端集成即可起步 | 中高，需要浏览器运行和任务基础设施 |
| 适合任务 | SaaS/ERP/CRM/Admin Copilot、表单流 | 跨站自动化、采集、测试、后台任务 |
| 安全边界 | 限于网页沙箱和页面权限 | 浏览器级自动化，边界更大 |
| 与本项目匹配度 | 高 | 中低，除非后续做后台跨站自动化 |

## 6. 推荐产品架构

建议采用“双层工具”方案：

```text
Web App
  ├─ React/Vue Router 页面
  ├─ Chat Agent UI
  ├─ 自定义业务工具，强约束、强审计
  │   ├─ navigate_to(route/page)
  │   ├─ fill_field(field, value)
  │   ├─ select_option(field, value)
  │   ├─ submit_form(formId)
  │   └─ call_business_api(name, params)
  ├─ PageAgent，处理通用页面 GUI 操作
  │   ├─ observe DOM
  │   ├─ click/input/select/scroll
  │   └─ natural language execute
  └─ Guardrails
      ├─ 高风险动作确认
      ├─ 敏感字段脱敏
      ├─ 审计日志
      └─ 用户接管
```

### 6.1 为什么要保留自定义工具

即使使用 PageAgent，也建议保留自定义工具：

- 业务动作比 DOM selector 稳定。
- 可以做参数校验、权限校验、审计日志。
- 可以对删除、提交、审批、付款等高风险操作加确认。
- 可以减少模型误点造成的副作用。

### 6.2 为什么还要接 PageAgent

仅靠自定义工具也有不足：

- 每个页面和动作都要人工定义工具。
- 对临时页面、低风险 UI 操作、辅助点击不够灵活。
- 用户表达复杂流程时，工具覆盖不一定完整。

PageAgent 可以作为“通用页面 GUI 能力”，用于覆盖没有显式工具的页面操作。

## 7. 当前 Demo 实现

推荐 demo：

```text
demos/webapp-chat-agent-react/
```

当前能力：

- React + TypeScript + Vite。
- React Router 真实路由：
  - `/customers`：客户列表
  - `/customers/new`：新建客户
  - `/reports`：数据报表
- 页面内 Chat Agent。
- 两种执行模式：
  1. 自定义工具调用：`observe_page`、`navigate_to`、`fill_field`、`select_option`、`click_button`、`extract_state`。
  2. PageAgent 模式：直接使用 `page-agent` 的 `new PageAgent(...).execute(task)`。
- OpenAI-compatible API 配置：`baseURL / model / apiKey`。
- 默认模型已切换为 `deepseek-v3.2`，因为当前 API 下它支持 PageAgent 依赖的工具调用格式。

测试提示词：

```text
切换到报表页
```

```text
先去新建客户页面，创建一个客户，姓名张三，公司阿里巴巴，城市杭州，等级VIP，然后保存
```

```text
从客户列表切换到新建客户页面，然后填写张三客户并保存
```

## 8. 什么时候仍然应该选择 browser-use

如果后续产品需求变成下面这些，browser-use 仍然值得考虑：

- 用户让 Agent 去外部网站查资料、登录第三方系统、跨站完成任务。
- 需要后台批量执行，不要求用户实时看见页面操作。
- 需要独立浏览器 profile、代理、下载、文件上传、自动化测试。
- 需要把 Web 自动化作为服务端平台能力，而不是某个 Web App 的内嵌 Copilot。

此时可以形成“双模式架构”：

```text
前台：Web App 内 Chat Agent + PageAgent + 自定义工具
后台：browser-use / Playwright worker 执行跨站或长任务
```

## 9. 最终建议

当前阶段建议：

1. **主线采用 React/Vue Web App 内 Chat Agent。**
2. **保留自定义工具调用作为生产级业务动作通道。**
3. **集成 PageAgent 作为页面 GUI fallback 和对照能力。**
4. **暂不把 browser-use 作为本场景主方案。**
5. **如果后续要做跨站后台自动化，再单独引入 browser-use。**

## 10. 参考资料

- Alibaba PageAgent GitHub: https://github.com/alibaba/page-agent
- PageAgent Docs: https://alibaba.github.io/page-agent/
- browser-use GitHub: https://github.com/browser-use/browser-use
- browser-use Docs: https://docs.browser-use.com/
