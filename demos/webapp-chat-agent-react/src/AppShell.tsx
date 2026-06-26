import { useMemo, useRef, useState } from 'react';
import type { PageAgent } from 'page-agent';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_API_KEY, DEFAULT_BASE_URL, DEFAULT_MODEL, initialForm, routePages } from './constants';
import type { AppPage, CustomerForm, Message } from './types';
import { id } from './utils/id';
import { createCustomTools, runCustomToolActions } from './strategies/custom-tools/tools';
import { buildMockPlan } from './strategies/custom-tools/planner';
import { callLlmPlanner } from './strategies/custom-tools/llmPlanner';
import { runPageAgentTask } from './strategies/page-agent/runPageAgent';
import { AppRoutes } from './components/AppRoutes';
import { ChatAgentPanel } from './components/ChatAgentPanel';

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage: AppPage = routePages[location.pathname] || 'list';
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [savedResult, setSavedResult] = useState('尚未保存客户。');
  const [messages, setMessages] = useState<Message[]>([
    { id: id(), role: 'system', content: '已加载 React 版多页面 Agent Demo。试试：先去新建客户页面，创建一个客户，姓名张三，公司阿里巴巴，城市杭州，等级VIP，然后保存；或：切换到报表页。' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'custom-tools' | 'page-agent'>('custom-tools');
  const [useMock, setUseMock] = useState(true);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [running, setRunning] = useState(false);
  const pageAgentRef = useRef<PageAgent | null>(null);

  const addMessage = (role: Message['role'], content: string) => {
    setMessages((prev) => [...prev, { id: id(), role, content }]);
  };

  const tools = useMemo(() => createCustomTools({
    currentPage,
    form,
    savedResult,
    navigate,
    setForm,
    setSavedResult,
  }), [currentPage, form, savedResult, navigate]);

  const onReset = () => tools.click_button({ button: 'reset' });
  const onSave = () => tools.click_button({ button: 'save' });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || running) return;

    setPrompt('');
    setRunning(true);
    addMessage('user', text);

    try {
      if (mode === 'page-agent') {
        addMessage('system', '执行模式：PageAgent。它会直接观察并操作当前页面 DOM。');
        const result = await runPageAgentTask(text, {
          baseUrl,
          model,
          apiKey,
          currentAgent: pageAgentRef.current,
          setCurrentAgent: (agent) => { pageAgentRef.current = agent; },
        });
        addMessage('assistant', `PageAgent 执行结果：${JSON.stringify(result, null, 2)}`);
      } else {
        addMessage('system', '执行模式：自定义工具调用。它只调用本 demo 显式暴露的业务工具。');
        const observation = tools.observe_page();
        addMessage('system', `页面观测：${JSON.stringify(observation, null, 2)}`);
        const plan = useMock
          ? buildMockPlan(text)
          : await callLlmPlanner({ userText: text, baseUrl, model, apiKey, observation });
        addMessage('assistant', `计划：${JSON.stringify(plan, null, 2)}`);
        if (plan.needUserConfirmation && !window.confirm('该动作需要确认，是否继续？')) return;
        const outputs = await runCustomToolActions({
          actions: plan.actions || [],
          currentPage,
          form,
          savedResult,
          navigate,
          setForm,
          setSavedResult,
          observe: tools.observe_page,
        });
        addMessage('assistant', `工具执行结果：${JSON.stringify(outputs, null, 2)}`);
      }
    } catch (error) {
      addMessage('system', `错误：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="layout">
      <main className="app">
        <header className="hero">
          <div>
            <p className="eyebrow">WebApp Agent Demo</p>
            <h1>客户管理系统</h1>
            <p>支持客户列表 / 新建客户 / 数据报表三个页面，可测试两种策略的页面切换。</p>
          </div>
        </header>
        <AppRoutes currentPage={currentPage} form={form} savedResult={savedResult} setForm={setForm} onReset={onReset} onSave={onSave} />
      </main>
      <ChatAgentPanel
        messages={messages}
        prompt={prompt}
        mode={mode}
        useMock={useMock}
        baseUrl={baseUrl}
        model={model}
        apiKey={apiKey}
        running={running}
        setPrompt={setPrompt}
        setMode={setMode}
        setUseMock={setUseMock}
        setBaseUrl={setBaseUrl}
        setModel={setModel}
        setApiKey={setApiKey}
        onSubmit={onSubmit}
      />
    </div>
  );
}
