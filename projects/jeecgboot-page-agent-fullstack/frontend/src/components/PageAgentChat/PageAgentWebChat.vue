<template>
  <div v-if="enabled" class="page-agent-chat">
    <button class="page-agent-chat__fab" type="button" @click="panelOpen = !panelOpen">
      <span>AI</span>
      <small>PageAgent</small>
    </button>

    <section v-show="panelOpen" class="page-agent-chat__panel">
      <header class="page-agent-chat__header">
        <div>
          <strong>PageAgent Web Chat</strong>
          <p>操作当前 JEECG Boot 页面</p>
        </div>
        <button type="button" @click="panelOpen = false">×</button>
      </header>

      <div class="page-agent-chat__config">
        <label>
          Base URL
          <input v-model="baseURL" placeholder="https://napi.zwanan.top/v1" />
        </label>
        <label>
          Model
          <input v-model="model" placeholder="deepseek-v3.2" />
        </label>
        <label>
          API Key
          <input v-model="apiKey" type="password" placeholder="sk-..." />
        </label>
        <label>
          Max Steps
          <input v-model.number="maxSteps" type="number" min="1" max="40" />
        </label>
        <p class="page-agent-chat__hint">
          Demo 直连 LLM API，正式产品建议改为后端代理，避免 API Key 暴露在浏览器。
        </p>
      </div>

      <main ref="messagesRef" class="page-agent-chat__messages">
        <article v-for="message in messages" :key="message.id" :class="['page-agent-chat__message', `is-${message.role}`]">
          <b>{{ roleLabel[message.role] }}</b>
          <pre>{{ message.content }}</pre>
        </article>
      </main>

      <form class="page-agent-chat__form" @submit.prevent="runTask">
        <textarea
          v-model="task"
          :disabled="running"
          rows="3"
          placeholder="例如：打开系统管理菜单，进入用户管理页面；或：在当前页面帮我点击查询按钮"
        />
        <div class="page-agent-chat__actions">
          <button type="button" :disabled="!running" @click="stopTask">停止</button>
          <button type="submit" :disabled="running || !task.trim()">{{ running ? '执行中...' : '发送' }}</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
  import { PageAgent } from 'page-agent';

  type ChatRole = 'system' | 'user' | 'assistant';
  type ChatMessage = {
    id: string;
    role: ChatRole;
    content: string;
  };

  const STORAGE_KEY = 'jeecgboot-page-agent-chat-config';
  const enabled = import.meta.env.VITE_PAGE_AGENT_ENABLED !== 'false';
  const panelOpen = ref(true);
  const baseURL = ref(import.meta.env.VITE_PAGE_AGENT_BASE_URL || 'https://napi.zwanan.top/v1');
  const model = ref(import.meta.env.VITE_PAGE_AGENT_MODEL || 'deepseek-v3.2');
  const apiKey = ref(import.meta.env.VITE_PAGE_AGENT_API_KEY || '');
  const maxSteps = ref(Number(import.meta.env.VITE_PAGE_AGENT_MAX_STEPS || 12));
  const task = ref('');
  const running = ref(false);
  const messagesRef = ref<HTMLElement | null>(null);
  const agentRef = ref<PageAgent | null>(null);

  const roleLabel: Record<ChatRole, string> = {
    system: '系统',
    user: '用户',
    assistant: 'PageAgent',
  };

  const messages = ref<ChatMessage[]>([
    {
      id: createId(),
      role: 'system',
      content:
        'PageAgent 已挂载在 JEECG Boot 前端最顶层 App.vue。它会观察并操作当前页面 DOM，适合测试页面内 Chat Agent 控制业务系统。',
    },
  ]);

  function createId() {
    return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  }

  function addMessage(role: ChatRole, content: string) {
    messages.value.push({ id: createId(), role, content });
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    });
  }

  function saveConfig() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ baseURL: baseURL.value, model: model.value, apiKey: apiKey.value, maxSteps: maxSteps.value })
    );
  }

  function loadConfig() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const config = JSON.parse(raw);
      baseURL.value = config.baseURL || baseURL.value;
      model.value = config.model || model.value;
      apiKey.value = config.apiKey || apiKey.value;
      maxSteps.value = Number(config.maxSteps || maxSteps.value);
    } catch (error) {
      console.warn('[PageAgentChat] failed to load config', error);
    }
  }

  async function runTask() {
    const text = task.value.trim();
    if (!text || running.value) return;
    if (!baseURL.value || !model.value || !apiKey.value) {
      addMessage('system', '请先填写 Base URL、Model 和 API Key。');
      return;
    }

    saveConfig();
    addMessage('user', text);
    task.value = '';
    running.value = true;

    try {
      agentRef.value?.dispose();
      const agent = new PageAgent({
        baseURL: baseURL.value,
        model: model.value,
        apiKey: apiKey.value,
        language: 'zh-CN',
        maxSteps: maxSteps.value,
        stepDelay: 0.2,
        promptForNextTask: false,
        disableNamedToolChoice: true,
        instructions: {
          system:
            '你正在操作 JEECG Boot Vue3 管理后台。优先点击页面中可见的菜单、按钮、表单项和路由链接。执行保存、删除、提交、授权、导出等高风险动作前，需要先 ask_user 询问用户确认。不要读取或输出密码、token、密钥等敏感字段。',
        },
        transformPageContent(content) {
          return content
            .replace(/sk-[A-Za-z0-9_-]{10,}/g, 'sk-***')
            .replace(/(password|token|secret|apiKey|api_key)\s*[:=]\s*[^\s<]+/gi, '$1=***');
        },
      });

      agent.onAskUser = async (question: string) => window.prompt(question) || '';
      agentRef.value = agent;

      const result = await agent.execute(text);
      addMessage('assistant', JSON.stringify(result, null, 2));
    } catch (error) {
      addMessage('system', `执行失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      running.value = false;
    }
  }

  async function stopTask() {
    await agentRef.value?.stop();
    running.value = false;
    addMessage('system', '已请求停止当前 PageAgent 任务。');
  }

  onMounted(loadConfig);

  onBeforeUnmount(() => {
    agentRef.value?.dispose();
  });
</script>

<style scoped lang="less">
  .page-agent-chat {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 2147483000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', PingFang SC, Microsoft YaHei, sans-serif;
  }

  .page-agent-chat__fab {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 76px;
    height: 76px;
    border: none;
    border-radius: 22px;
    color: #fff;
    cursor: pointer;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    box-shadow: 0 16px 40px rgba(37, 99, 235, 0.35);

    span,
    small {
      display: block;
      line-height: 1.2;
    }

    span {
      font-size: 20px;
      font-weight: 800;
    }

    small {
      opacity: 0.9;
      font-size: 11px;
    }
  }

  .page-agent-chat__panel {
    position: absolute;
    right: 0;
    bottom: 88px;
    width: 420px;
    max-width: calc(100vw - 32px);
    height: min(720px, calc(100vh - 128px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.2);
  }

  .page-agent-chat__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    color: #fff;
    background: linear-gradient(135deg, #1d4ed8, #6d28d9);

    p {
      margin: 4px 0 0;
      font-size: 12px;
      opacity: 0.8;
    }

    button {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.18);
    }
  }

  .page-agent-chat__config {
    display: grid;
    gap: 8px;
    padding: 12px 14px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;

    label {
      display: grid;
      gap: 4px;
      color: #334155;
      font-size: 12px;
      font-weight: 600;
    }

    input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px;
      font: inherit;
    }
  }

  .page-agent-chat__hint {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
  }

  .page-agent-chat__messages {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }

  .page-agent-chat__message {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px;
    background: #f8fafc;

    &.is-user {
      background: #eff6ff;
    }

    &.is-assistant {
      background: #ecfdf5;
    }

    b {
      display: block;
      margin-bottom: 6px;
      color: #334155;
      font-size: 12px;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      color: #0f172a;
      font-size: 12px;
      font-family: inherit;
    }
  }

  .page-agent-chat__form {
    display: grid;
    gap: 10px;
    padding: 12px;
    border-top: 1px solid #e2e8f0;

    textarea {
      resize: vertical;
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px;
      font: inherit;
    }
  }

  .page-agent-chat__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    button {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      background: #fff;

      &[type='submit'] {
        color: #fff;
        border-color: #2563eb;
        background: #2563eb;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
    }
  }
</style>
