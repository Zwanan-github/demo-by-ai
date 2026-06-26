export type CustomerForm = {
  customerName: string;
  company: string;
  city: string;
  level: '普通' | '重要' | 'VIP';
};

export type AppPage = 'list' | 'create' | 'reports';

export type ToolName =
  | 'observe_page'
  | 'navigate_to'
  | 'fill_field'
  | 'select_option'
  | 'click_button'
  | 'extract_state';

export type ToolAction = {
  tool: ToolName;
  args?: Record<string, string>;
};

export type AgentPlan = {
  thought: string;
  actions: ToolAction[];
  needUserConfirmation: boolean;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};
