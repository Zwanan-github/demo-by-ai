import type { Message } from '../types';

export function ChatAgentPanel(props: {
  messages: Message[];
  prompt: string;
  mode: 'custom-tools' | 'page-agent';
  useMock: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  running: boolean;
  setPrompt: (value: string) => void;
  setMode: (value: 'custom-tools' | 'page-agent') => void;
  setUseMock: (value: boolean) => void;
  setBaseUrl: (value: string) => void;
  setModel: (value: string) => void;
  setApiKey: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const { messages, prompt, mode, useMock, baseUrl, model, apiKey, running, setPrompt, setMode, setUseMock, setBaseUrl, setModel, setApiKey, onSubmit } = props;
  return (
    <aside className="agent">
      <h2>Chat Agent</h2>
      <section className="config">
        <label>执行模式
          <select value={mode} onChange={(e) => setMode(e.target.value as 'custom-tools' | 'page-agent')}>
            <option value="custom-tools">自定义工具调用，对照组</option>
            <option value="page-agent">PageAgent 库，页面 GUI Agent</option>
          </select>
        </label>
        {mode === 'custom-tools' && <label className="checkbox"><input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} /> Use mock planner</label>}
        <label>Base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label>
        <label>Model<input value={model} onChange={(e) => setModel(e.target.value)} /></label>
        <label>API Key<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." /></label>
        <p className="hint">自定义工具模式通过 navigate_to 切换页面；PageAgent 模式通过点击导航按钮切换页面。</p>
      </section>
      <div className="messages">
        {messages.map((msg) => <div key={msg.id} className={`msg ${msg.role}`}>{msg.content}</div>)}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="例如：切换到报表页 / 去新建客户页面，创建张三客户并保存" />
        <button disabled={running}>{running ? '执行中...' : '发送'}</button>
      </form>
    </aside>
  );
}
