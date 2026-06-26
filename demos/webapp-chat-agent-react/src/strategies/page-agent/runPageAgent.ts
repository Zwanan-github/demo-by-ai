import { PageAgent } from 'page-agent';

export type PageAgentRunnerConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
  currentAgent: PageAgent | null;
  setCurrentAgent: (agent: PageAgent | null) => void;
};

export async function runPageAgentTask(userText: string, config: PageAgentRunnerConfig) {
  const { baseUrl, model, apiKey, currentAgent, setCurrentAgent } = config;
  if (!baseUrl || !model || !apiKey) {
    throw new Error('PageAgent 模式需要填写 Base URL / Model / API Key。');
  }

  currentAgent?.dispose();
  const agent = new PageAgent({
    baseURL: baseUrl,
    model,
    apiKey,
    language: 'zh-CN',
    maxSteps: 12,
    stepDelay: 0.2,
    promptForNextTask: false,
    disableNamedToolChoice: true,
    instructions: {
      system:
        '你正在操作一个客户管理 React Router Demo。页面顶部有导航链接：客户列表(/customers)、新建客户(/customers/new)、数据报表(/reports)。如果任务需要切换页面，请先点击对应导航链接。保存客户前确认姓名、公司、城市、客户等级都已正确填写。不要执行删除、付款、发送消息等高风险动作。',
    },
  });

  agent.onAskUser = async (question: string) => window.prompt(question) || '';
  setCurrentAgent(agent);
  return await agent.execute(userText);
}
