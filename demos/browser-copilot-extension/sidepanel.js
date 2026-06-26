const $ = (id) => document.getElementById(id);
const messages = $('messages');
const form = $('chatForm');
const input = $('input');
const observeBtn = $('observeBtn');
const mock = $('mock');
const baseUrl = $('baseUrl');
const model = $('model');
const apiKey = $('apiKey');

async function loadConfig() {
  const cfg = await chrome.storage.local.get(['mock', 'baseUrl', 'model', 'apiKey']);
  mock.checked = cfg.mock ?? true;
  baseUrl.value = cfg.baseUrl || '';
  model.value = cfg.model || 'gpt-4.1-mini';
  apiKey.value = cfg.apiKey || '';
}

async function saveConfig() {
  await chrome.storage.local.set({ mock: mock.checked, baseUrl: baseUrl.value, model: model.value, apiKey: apiKey.value });
}

[mock, baseUrl, model, apiKey].forEach(el => el.addEventListener('change', saveConfig));

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab');
  return tab;
}

async function sendToContent(type, payload = {}) {
  const tab = await currentTab();
  try {
    return await chrome.tabs.sendMessage(tab.id, { type, ...payload });
  } catch (error) {
    // Some pages are opened before extension install; inject content script as fallback.
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    return await chrome.tabs.sendMessage(tab.id, { type, ...payload });
  }
}

function findBest(observation, predicates) {
  return observation.elements.find(el => predicates.some(p => p(el)));
}

function mockPlan(userText, observation) {
  const text = userText.toLowerCase();
  const actions = [];
  const keyword = (userText.match(/(?:搜索|查询|填成|输入)\s*([^，。,. ]+)/) || [])[1] || (text.includes('杭州') ? '杭州' : 'demo');

  if (text.includes('滚动') || text.includes('scroll')) {
    actions.push({ type: 'scroll', y: 600 });
  }

  const inputEl = findBest(observation, [
    el => el.role === 'textbox' && /搜索|查询|城市|keyword|search|city/i.test(`${el.label} ${el.placeholder} ${el.name}`),
    el => el.role === 'textbox'
  ]);
  if ((text.includes('搜索') || text.includes('查询') || text.includes('输入') || text.includes('填')) && inputEl) {
    actions.push({ type: 'input', targetId: inputEl.id, text: keyword });
  }

  const button = findBest(observation, [
    el => el.role === 'button' && /搜索|查询|提交|search|submit/i.test(`${el.text} ${el.label}`),
    el => el.role === 'button'
  ]);
  if ((text.includes('点击') || text.includes('搜索') || text.includes('查询') || text.includes('提交')) && button) {
    actions.push({ type: 'click', targetId: button.id });
  }

  if (text.includes('提取') || text.includes('总结') || text.includes('内容')) actions.push({ type: 'extract' });
  if (!actions.length) actions.push({ type: 'extract' });
  return { thought: 'mock planner generated actions from simple rules', actions, needUserConfirmation: false };
}

function plannerPrompt(userText, observation) {
  return `You are a browser-control planner. Return JSON only.\n\nAllowed actions:\n- {"type":"click","targetId":"e1"}\n- {"type":"input","targetId":"e1","text":"..."}\n- {"type":"select","targetId":"e1","value":"..."}\n- {"type":"scroll","y":500}\n- {"type":"wait","ms":800}\n- {"type":"extract"}\n- {"type":"open_url","url":"https://..."}\n\nSchema:\n{"thought":"short reason","actions":[],"needUserConfirmation":false}\n\nSafety: set needUserConfirmation=true before payment, purchase, delete, sending messages/emails, or submitting sensitive forms. Do not ask for password/captcha automation.\n\nUser task: ${userText}\n\nCurrent page observation:\n${JSON.stringify(observation, null, 2).slice(0, 14000)}`;
}

async function llmPlan(userText, observation) {
  const url = baseUrl.value.replace(/\/$/, '') + '/chat/completions';
  if (!baseUrl.value || !apiKey.value || !model.value) throw new Error('Please fill baseUrl, apiKey and model, or enable mock planner.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey.value}` },
    body: JSON.stringify({
      model: model.value,
      temperature: 0,
      messages: [
        { role: 'system', content: 'You output strict JSON only for browser control actions.' },
        { role: 'user', content: plannerPrompt(userText, observation) }
      ]
    })
  });
  if (!response.ok) throw new Error(`LLM HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content.replace(/^```json\s*|\s*```$/g, ''));
}

async function observeAndShow() {
  const res = await sendToContent('OBSERVE_PAGE');
  if (!res?.ok) throw new Error(res?.error || 'observe failed');
  addMessage('system', `页面：${res.observation.title}\nURL：${res.observation.url}\n可交互元素：${res.observation.elements.length}`);
  return res.observation;
}

observeBtn.addEventListener('click', async () => {
  try { await observeAndShow(); } catch (error) { addMessage('system', `错误：${error.message}`); }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const userText = input.value.trim();
  if (!userText) return;
  input.value = '';
  addMessage('user', userText);
  try {
    await saveConfig();
    const observation = await observeAndShow();
    const plan = mock.checked ? mockPlan(userText, observation) : await llmPlan(userText, observation);
    addMessage('assistant', `计划：${JSON.stringify(plan, null, 2)}`);
    if (plan.needUserConfirmation && !confirm('该计划包含高风险动作，是否继续执行？')) return;
    const run = await sendToContent('RUN_ACTIONS', { actions: plan.actions || [] });
    if (!run?.ok) throw new Error(run?.error || 'run failed');
    addMessage('assistant', `执行结果：${JSON.stringify(run.results, null, 2)}`);
  } catch (error) {
    addMessage('system', `错误：${error.message}`);
  }
});

loadConfig();
