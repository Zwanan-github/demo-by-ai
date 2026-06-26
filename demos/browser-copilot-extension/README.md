# Browser Copilot Extension Demo

一个零构建的 Chrome/Chromium Manifest V3 Demo：在浏览器 Side Panel 中聊天，并控制当前网页。

## 功能

- 读取当前 tab 的可交互 DOM 摘要。
- 在侧边栏聊天并生成动作计划。
- 默认使用 mock planner，无需 API key。
- 可配置 OpenAI-compatible API：`baseUrl`、`apiKey`、`model`。
- 支持动作：`input`、`click`、`scroll`、`wait`、`extract`、`open_url`。

## 安装

1. 打开 Chrome/Chromium：`chrome://extensions/`
2. 打开 Developer mode。
3. 点击 Load unpacked。
4. 选择本目录：`demos/browser-copilot-extension/`
5. 打开任意网页，点击扩展图标或打开 Side Panel。

## 本地测试页

推荐启动一个本地静态服务，避免 Chrome 默认禁止扩展访问 `file://` 页面：

```bash
cd demos/browser-copilot-extension/sample
python3 -m http.server 18080
# 然后打开 http://127.0.0.1:18080
```

如果直接打开 `sample/index.html`，需要在 `chrome://extensions/` 里为该扩展开启 “Allow access to file URLs”。

然后在侧边栏输入：

```text
搜索杭州
```

或：

```text
把城市填成杭州，然后点击查询
```

## OpenAI-compatible API 占位配置

在侧边栏里取消勾选 `Use mock planner`，填写：

```text
Base URL: https://your-openai-compatible-endpoint/v1
API Key: 你的 key
Model: 你的模型名
```

请求格式使用 `/chat/completions`，与 OpenAI Chat Completions 兼容。

## 注意

这是技术验证 demo，不适合直接生产使用。生产前至少需要：

- 动作确认机制；
- 敏感字段脱敏；
- 更强 DOM 定位；
- iframe/Shadow DOM 处理；
- trace 日志；
- 权限最小化和隐私说明。
