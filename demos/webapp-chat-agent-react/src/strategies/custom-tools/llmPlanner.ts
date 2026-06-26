import { buildPlannerPrompt, extractJson } from './planner';
import type { AgentPlan } from '../../types';

export async function callLlmPlanner(params: {
  userText: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  observation: unknown;
}): Promise<AgentPlan> {
  const { userText, baseUrl, model, apiKey, observation } = params;
  if (!baseUrl || !model || !apiKey) {
    throw new Error('请填写 Base URL / Model / API Key，或开启 mock planner。');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: '你只输出严格 JSON，不要 Markdown。' },
        { role: 'user', content: buildPlannerPrompt(userText, observation) },
      ],
    }),
  });

  if (!response.ok) throw new Error(`LLM HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return extractJson(data.choices?.[0]?.message?.content || '{}');
}
