# WebApp Chat Agent 交付索引

> 日期：2026-06-26

## 1. 推荐阅读顺序

1. 调研对比文档：

```text
research/browser-control-pageagent-browseruse.md
```

说明 PageAgent 与 browser-use 的区别，以及为什么当前场景更适合 PageAgent。

2. 方案设计文档：

```text
docs/webapp-chat-agent-tool-architecture.md
```

说明 Web App 内 Chat Agent 的推荐架构、自定义工具与 PageAgent 双策略设计。

3. React Demo：

```text
demos/webapp-chat-agent-react/
```

可运行 demo，包含 React Router、多页面切换、自定义工具调用和 PageAgent 两种模式。

## 2. 当前 Demo 能力

- React + Vite + TypeScript。
- React Router 真实路由：
  - `/customers`
  - `/customers/new`
  - `/reports`
- 页面内 Chat Agent。
- 自定义工具调用模式。
- PageAgent 模式。
- OpenAI-compatible API。

## 3. 核心结论

> 对“自家 Web App 内 Chat Agent 控制当前应用页面”的场景，PageAgent 比 browser-use 更合适。

原因：

- PageAgent 是页面内 JavaScript GUI Agent；
- browser-use 是外部浏览器自动化框架；
- PageAgent 直接使用当前页面、当前登录态、当前路由；
- browser-use 更适合跨站、后台、自动化测试和数据采集；
- 生产上应采用“自定义业务工具 + PageAgent fallback”的组合。

## 4. 浏览器扩展 Demo

之前还保留了一个浏览器扩展方向 demo：

```text
demos/browser-copilot-extension/
```

它适合“控制用户当前浏览器 tab/任意网页”的另一个方向，不是当前 Web App 内嵌 Chat Agent 的主线。
