import type { AgentPlan, AppPage, ToolAction } from '../../types';

export function extractJson(content: string): AgentPlan {
  return JSON.parse(content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) as AgentPlan;
}

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

export function buildMockPlan(userText: string): AgentPlan {
  const actions: ToolAction[] = [];
  const targetPage = detectTargetPage(userText);
  if (targetPage) actions.push({ tool: 'navigate_to', args: { page: targetPage } });

  const name = parseValue(userText, ['姓名', '客户姓名', '名字']) || (userText.includes('张三') ? '张三' : '');
  const company = parseValue(userText, ['公司', '企业']) || (userText.includes('阿里巴巴') ? '阿里巴巴' : '');
  const city = parseValue(userText, ['城市', '地区']) || ['杭州', '上海', '北京', '深圳'].find((v) => userText.includes(v));
  const level = ['VIP', '重要', '普通'].find((v) => userText.includes(v));

  if (name || company || city || level || /保存|提交|创建|新建|新增/.test(userText)) {
    if (!actions.some((a) => a.tool === 'navigate_to' && a.args?.page === 'create')) {
      actions.unshift({ tool: 'navigate_to', args: { page: 'create' } });
    }
  }

  if (name) actions.push({ tool: 'fill_field', args: { field: 'customerName', value: name } });
  if (company) actions.push({ tool: 'fill_field', args: { field: 'company', value: company } });
  if (city) actions.push({ tool: 'select_option', args: { field: 'city', value: city } });
  if (level) actions.push({ tool: 'select_option', args: { field: 'level', value: level } });
  if (/保存|提交|创建|新增/.test(userText)) actions.push({ tool: 'click_button', args: { button: 'save' } });
  if (/重置|清空/.test(userText)) actions.push({ tool: 'click_button', args: { button: 'reset' } });
  if (!actions.length) actions.push({ tool: 'extract_state', args: {} });

  return {
    thought: 'mock planner 根据导航目标、业务字段和按钮生成工具调用',
    actions,
    needUserConfirmation: false,
  };
}

export function buildPlannerPrompt(userText: string, observation: unknown) {
  return `你是一个网页应用内的 Chat Agent planner。你只能调用应用显式暴露的工具。若用户要求页面切换，请调用 navigate_to。不要输出 Markdown，必须返回严格 JSON。\n\n可用工具：\n- {"tool":"observe_page","args":{}}\n- {"tool":"navigate_to","args":{"page":"list|create|reports"}}\n- {"tool":"fill_field","args":{"field":"customerName|company|city|level","value":"..."}}\n- {"tool":"select_option","args":{"field":"city|level","value":"..."}}\n- {"tool":"click_button","args":{"button":"save|reset"}}\n- {"tool":"extract_state","args":{}}\n\n返回 schema：\n{"thought":"简短原因","actions":[{"tool":"...","args":{}}],"needUserConfirmation":false}\n\n如果是删除、付款、发送消息、修改权限等高风险动作，需要 needUserConfirmation=true。\n\n用户需求：${userText}\n\n当前页面观测：\n${JSON.stringify(observation, null, 2)}`;
}
