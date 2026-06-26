import React, { useMemo, useRef, useState } from 'react';
import { PageAgent } from 'page-agent';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import type { AgentPlan, AppPage, CustomerForm, Message, ToolAction } from './types';

const DEFAULT_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://napi.zwanan.top/v1';
const DEFAULT_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'deepseek-v3.2';
const DEFAULT_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const initialForm: CustomerForm = { customerName: '', company: '', city: '', level: '普通' };
const pageLabels: Record<AppPage, string> = { list: '客户列表', create: '新建客户', reports: '数据报表' };
const pageRoutes: Record<AppPage, string> = { list: '/customers', create: '/customers/new', reports: '/reports' };
const routePages: Record<string, AppPage> = { '/customers': 'list', '/customers/new': 'create', '/reports': 'reports' };
const sampleCustomers = [
  { name: '李雷', company: '蚂蚁集团', city: '杭州', level: 'VIP' },
  { name: '王芳', company: '钉钉', city: '上海', level: '重要' },
  { name: '赵强', company: '菜鸟', city: '深圳', level: '普通' },
];

function id() { return crypto.randomUUID?.() || String(Date.now() + Math.random()); }
function extractJson(content: string): AgentPlan { return JSON.parse(content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) as AgentPlan; }
function parseValue(text: string, keys: string[]) {
  for (const key of keys) {
    const match = text.match(new RegExp(`${key}[:：]?\\s*([^，。,.；;\\s]+)`));
    if (match?.[1]) return match[1];
  }
  return '';
}
function detectTargetPage(userText: string): AppPage | undefined {
  if (/列表|客户列表|首页/.test(userText)) return 'list';
  if (/新建|创建|新增|表单/.test(userText)) return 'create';
  if (/报表|统计|数据/.test(userText)) return 'reports';
  return undefined;
}
function buildMockPlan(userText: string): AgentPlan {
  const actions: ToolAction[] = [];
  const targetPage = detectTargetPage(userText);
  if (targetPage) actions.push({ tool: 'navigate_to', args: { page: targetPage } });
  const name = parseValue(userText, ['姓名', '客户姓名', '名字']) || (userText.includes('张三') ? '张三' : '');
  const company = parseValue(userText, ['公司', '企业']) || (userText.includes('阿里巴巴') ? '阿里巴巴' : '');
  const city = parseValue(userText, ['城市', '地区']) || ['杭州', '上海', '北京', '深圳'].find((v) => userText.includes(v));
  const level = ['VIP', '重要', '普通'].find((v) => userText.includes(v));
  if (name || company || city || level || /保存|提交|创建|新建|新增/.test(userText)) {
    if (!actions.some((a) => a.tool === 'navigate_to' && a.args?.page === 'create')) actions.unshift({ tool: 'navigate_to', args: { page: 'create' } });
  }
  if (name) actions.push({ tool: 'fill_field', args: { field: 'customerName', value: name } });
  if (company) actions.push({ tool: 'fill_field', args: { field: 'company', value: company } });
  if (city) actions.push({ tool: 'select_option', args: { field: 'city', value: city } });
  if (level) actions.push({ tool: 'select_option', args: { field: 'level', value: level } });
  if (/保存|提交|创建|新增/.test(userText)) actions.push({ tool: 'click_button', args: { button: 'save' } });
  if (/重置|清空/.test(userText)) actions.push({ tool: 'click_button', args: { button: 'reset' } });
  if (!actions.length) actions.push({ tool: 'extract_state', args: {} });
  return { thought: 'mock planner 根据导航目标、业务字段和按钮生成工具调用', actions, needUserConfirmation: false };
}
function buildPlannerPrompt(userText: string, observation: unknown) {
  return `你是一个网页应用内的 Chat Agent planner。你只能调用应用显式暴露的工具。若用户要求页面切换，请调用 navigate_to。不要输出 Markdown，必须返回严格 JSON。\n\n可用工具：\n- {"tool":"observe_page","args":{}}\n- {"tool":"navigate_to","args":{"page":"list|create|reports"}}\n- {"tool":"fill_field","args":{"field":"customerName|company|city|level","value":"..."}}\n- {"tool":"select_option","args":{"field":"city|level","value":"..."}}\n- {"tool":"click_button","args":{"button":"save|reset"}}\n- {"tool":"extract_state","args":{}}\n\n返回 schema：\n{"thought":"简短原因","actions":[{"tool":"...","args":{}}],"needUserConfirmation":false}\n\n如果是删除、付款、发送消息、修改权限等高风险动作，需要 needUserConfirmation=true。\n\n用户需求：${userText}\n\n当前页面观测：\n${JSON.stringify(observation, null, 2)}`;
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage: AppPage = routePages[location.pathname] || 'list';
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [savedResult, setSavedResult] = useState('尚未保存客户。');
  const [messages, setMessages] = useState<Message[]>([{ id: id(), role: 'system', content: '已加载 React 版多页面 Agent Demo。试试：先去新建客户页面，创建一个客户，姓名张三，公司阿里巴巴，城市杭州，等级VIP，然后保存；或：切换到报表页。' }]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'custom-tools' | 'page-agent'>('custom-tools');
  const [useMock, setUseMock] = useState(true);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [running, setRunning] = useState(false);
  const pageAgentRef = useRef<PageAgent | null>(null);
  const addMessage = (role: Message['role'], content: string) => setMessages((prev) => [...prev, { id: id(), role, content }]);

  const tools = useMemo(() => ({
    observe_page: () => ({
      app: '客户管理系统 Demo', currentPage,
      pages: [{ page: 'list', label: '客户列表' }, { page: 'create', label: '新建客户' }, { page: 'reports', label: '数据报表' }],
      fields: currentPage === 'create' ? [
        { field: 'customerName', label: '客户姓名', value: form.customerName, type: 'input' },
        { field: 'company', label: '公司', value: form.company, type: 'input' },
        { field: 'city', label: '城市', value: form.city, type: 'select', options: ['杭州', '上海', '北京', '深圳'] },
        { field: 'level', label: '客户等级', value: form.level, type: 'select', options: ['普通', '重要', 'VIP'] },
      ] : [],
      buttons: currentPage === 'create' ? [{ button: 'reset', text: '重置' }, { button: 'save', text: '保存客户' }] : [],
      savedResult,
    }),
    navigate_to: ({ page }: Record<string, string>) => {
      if (!['list', 'create', 'reports'].includes(page)) throw new Error(`unknown page: ${page}`);
      navigate(pageRoutes[page as AppPage]); return { ok: true, page, route: pageRoutes[page as AppPage], label: pageLabels[page as AppPage] };
    },
    fill_field: ({ field, value }: Record<string, string>) => {
      if (!['customerName', 'company', 'city', 'level'].includes(field)) throw new Error(`unknown field: ${field}`);
      setForm((prev) => ({ ...prev, [field]: value } as CustomerForm)); return { ok: true, field, value };
    },
    select_option: ({ field, value }: Record<string, string>) => {
      if (field === 'city' && !['杭州', '上海', '北京', '深圳', ''].includes(value)) throw new Error(`invalid city: ${value}`);
      if (field === 'level' && !['普通', '重要', 'VIP'].includes(value)) throw new Error(`invalid level: ${value}`);
      setForm((prev) => ({ ...prev, [field]: value } as CustomerForm)); return { ok: true, field, value };
    },
    click_button: ({ button }: Record<string, string>) => {
      if (button === 'reset') { setForm(initialForm); setSavedResult('已重置。'); return { ok: true, button }; }
      if (button === 'save') { const snapshot = { ...form }; const output = JSON.stringify({ savedAt: new Date().toLocaleString(), ...snapshot }, null, 2); setSavedResult(output); return { ok: true, button, saved: snapshot }; }
      throw new Error(`unknown button: ${button}`);
    },
    extract_state: () => ({ currentPage, ...form, savedResult }),
  }), [currentPage, form, savedResult]);

  const callLlmPlanner = async (userText: string): Promise<AgentPlan> => {
    if (!baseUrl || !model || !apiKey) throw new Error('请填写 Base URL / Model / API Key，或开启 mock planner。');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0, messages: [{ role: 'system', content: '你只输出严格 JSON，不要 Markdown。' }, { role: 'user', content: buildPlannerPrompt(userText, tools.observe_page()) }] }),
    });
    if (!response.ok) throw new Error(`LLM HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json(); return extractJson(data.choices?.[0]?.message?.content || '{}');
  };

  const runActions = async (actions: ToolAction[]) => {
    let draftPage: AppPage = currentPage; let draft: CustomerForm = { ...form }; let draftSavedResult = savedResult; const outputs: unknown[] = [];
    for (const action of actions) {
      const args = action.args || {};
      if (action.tool === 'observe_page') outputs.push({ tool: action.tool, output: tools.observe_page() });
      else if (action.tool === 'navigate_to') { const page = args.page as AppPage; if (!['list', 'create', 'reports'].includes(page)) throw new Error(`unknown page: ${args.page}`); draftPage = page; outputs.push({ tool: action.tool, output: { ok: true, page, route: pageRoutes[page], label: pageLabels[page] } }); }
      else if (action.tool === 'fill_field') { const field = args.field; const value = args.value ?? ''; if (!['customerName', 'company', 'city', 'level'].includes(field)) throw new Error(`unknown field: ${field}`); draft = { ...draft, [field]: value } as CustomerForm; outputs.push({ tool: action.tool, output: { ok: true, field, value } }); }
      else if (action.tool === 'select_option') { const field = args.field; const value = args.value ?? ''; if (field === 'city' && !['杭州', '上海', '北京', '深圳', ''].includes(value)) throw new Error(`invalid city: ${value}`); if (field === 'level' && !['普通', '重要', 'VIP'].includes(value)) throw new Error(`invalid level: ${value}`); draft = { ...draft, [field]: value } as CustomerForm; outputs.push({ tool: action.tool, output: { ok: true, field, value } }); }
      else if (action.tool === 'click_button') { const button = args.button; if (button === 'reset') { draft = initialForm; draftSavedResult = '已重置。'; outputs.push({ tool: action.tool, output: { ok: true, button } }); } else if (button === 'save') { draftSavedResult = JSON.stringify({ savedAt: new Date().toLocaleString(), ...draft }, null, 2); outputs.push({ tool: action.tool, output: { ok: true, button, saved: draft } }); } else throw new Error(`unknown button: ${button}`); }
      else if (action.tool === 'extract_state') outputs.push({ tool: action.tool, output: { currentPage: draftPage, ...draft, savedResult: draftSavedResult } });
      else throw new Error(`unknown tool: ${action.tool}`);
    }
    navigate(pageRoutes[draftPage]); setForm(draft); setSavedResult(draftSavedResult); return outputs;
  };

  const runPageAgent = async (userText: string) => {
    if (!baseUrl || !model || !apiKey) throw new Error('PageAgent 模式需要填写 Base URL / Model / API Key。');
    pageAgentRef.current?.dispose();
    const agent = new PageAgent({
      baseURL: baseUrl, model, apiKey, language: 'zh-CN', maxSteps: 12, stepDelay: 0.2, promptForNextTask: false, disableNamedToolChoice: true,
      instructions: { system: '你正在操作一个客户管理 React Router Demo。页面顶部有导航链接：客户列表(/customers)、新建客户(/customers/new)、数据报表(/reports)。如果任务需要切换页面，请先点击对应导航链接。保存客户前确认姓名、公司、城市、客户等级都已正确填写。不要执行删除、付款、发送消息等高风险动作。' },
    });
    agent.onAskUser = async (question: string) => window.prompt(question) || ''; pageAgentRef.current = agent;
    return await agent.execute(userText);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); const text = prompt.trim(); if (!text || running) return; setPrompt(''); setRunning(true); addMessage('user', text);
    try {
      if (mode === 'page-agent') { addMessage('system', '执行模式：PageAgent。它会直接观察并操作当前页面 DOM。'); const result = await runPageAgent(text); addMessage('assistant', `PageAgent 执行结果：${JSON.stringify(result, null, 2)}`); }
      else { addMessage('system', '执行模式：自定义工具调用。它只调用本 demo 显式暴露的业务工具。'); const observation = tools.observe_page(); addMessage('system', `页面观测：${JSON.stringify(observation, null, 2)}`); const plan = useMock ? buildMockPlan(text) : await callLlmPlanner(text); addMessage('assistant', `计划：${JSON.stringify(plan, null, 2)}`); if (plan.needUserConfirmation && !window.confirm('该动作需要确认，是否继续？')) return; const outputs = await runActions(plan.actions || []); addMessage('assistant', `工具执行结果：${JSON.stringify(outputs, null, 2)}`); }
    } catch (error) { addMessage('system', `错误：${error instanceof Error ? error.message : String(error)}`); }
    finally { setRunning(false); }
  };

  const renderPage = () => {
    if (currentPage === 'list') return <section className="card"><h2>客户列表</h2><p className="muted">用于测试 Agent 从其他页面切换到新建页面，或读取列表信息。</p><div className="table"><div className="table-row table-head"><span>姓名</span><span>公司</span><span>城市</span><span>等级</span></div>{sampleCustomers.map((c) => <div className="table-row" key={c.name}><span>{c.name}</span><span>{c.company}</span><span>{c.city}</span><span>{c.level}</span></div>)}</div></section>;
    if (currentPage === 'reports') return <section className="card"><h2>数据报表</h2><p className="muted">用于测试 Agent 页面切换和内容提取。</p><div className="metrics"><div><strong>128</strong><span>客户总数</span></div><div><strong>42</strong><span>本月新增</span></div><div><strong>36%</strong><span>VIP 占比</span></div></div><pre>{`杭州：56\n上海：31\n北京：22\n深圳：19`}</pre></section>;
    return <><section className="card"><h2>新建客户</h2><div className="form-grid"><label>客户姓名<input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="例如：张三" /></label><label>公司<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="例如：阿里巴巴" /></label><label>城市<select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}><option value="">请选择</option><option value="杭州">杭州</option><option value="上海">上海</option><option value="北京">北京</option><option value="深圳">深圳</option></select></label><label>客户等级<select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as CustomerForm['level'] })}><option value="普通">普通</option><option value="重要">重要</option><option value="VIP">VIP</option></select></label></div><div className="actions"><button onClick={() => tools.click_button({ button: 'reset' })}>重置</button><button className="primary" onClick={() => tools.click_button({ button: 'save' })}>保存客户</button></div></section><section className="card"><h2>保存结果</h2><pre>{savedResult}</pre></section></>;
  };

  return <div className="layout"><main className="app"><header className="hero"><div><p className="eyebrow">WebApp Agent Demo</p><h1>客户管理系统</h1><p>支持客户列表 / 新建客户 / 数据报表三个页面，可测试两种策略的页面切换。</p></div></header><nav className="tabs" aria-label="主导航">{(Object.keys(pageLabels) as AppPage[]).map((page) => <Link key={page} className={currentPage === page ? 'active' : ''} to={pageRoutes[page]}>{pageLabels[page]}</Link>)}</nav><Routes><Route path="/" element={<Navigate to="/customers" replace />} /><Route path="/customers" element={renderPage()} /><Route path="/customers/new" element={renderPage()} /><Route path="/reports" element={renderPage()} /></Routes></main><aside className="agent"><h2>Chat Agent</h2><section className="config"><label>执行模式<select value={mode} onChange={(e) => setMode(e.target.value as 'custom-tools' | 'page-agent')}><option value="custom-tools">自定义工具调用，对照组</option><option value="page-agent">PageAgent 库，页面 GUI Agent</option></select></label>{mode === 'custom-tools' && <label className="checkbox"><input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} /> Use mock planner</label>}<label>Base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></label><label>Model<input value={model} onChange={(e) => setModel(e.target.value)} /></label><label>API Key<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." /></label><p className="hint">自定义工具模式通过 navigate_to 切换页面；PageAgent 模式通过点击导航按钮切换页面。</p></section><div className="messages">{messages.map((msg) => <div key={msg.id} className={`msg ${msg.role}`}>{msg.content}</div>)}</div><form className="chat-form" onSubmit={onSubmit}><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="例如：切换到报表页 / 去新建客户页面，创建张三客户并保存" /><button disabled={running}>{running ? '执行中...' : '发送'}</button></form></aside></div>;
}

function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}

createRoot(document.getElementById('root')!).render(<App />);
