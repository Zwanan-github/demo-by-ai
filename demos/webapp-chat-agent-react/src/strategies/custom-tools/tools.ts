import { initialForm, pageLabels, pageRoutes } from '../../constants';
import type { AppPage, CustomerForm, ToolAction } from '../../types';

export type CustomToolsContext = {
  currentPage: AppPage;
  form: CustomerForm;
  savedResult: string;
  navigate: (path: string) => void;
  setForm: (form: CustomerForm | ((prev: CustomerForm) => CustomerForm)) => void;
  setSavedResult: (result: string) => void;
};

export function createCustomTools(ctx: CustomToolsContext) {
  const { currentPage, form, savedResult, navigate, setForm, setSavedResult } = ctx;

  return {
    observe_page: () => ({
      app: '客户管理系统 Demo',
      currentPage,
      pages: [
        { page: 'list', label: '客户列表' },
        { page: 'create', label: '新建客户' },
        { page: 'reports', label: '数据报表' },
      ],
      fields: currentPage === 'create' ? [
        { field: 'customerName', label: '客户姓名', value: form.customerName, type: 'input' },
        { field: 'company', label: '公司', value: form.company, type: 'input' },
        { field: 'city', label: '城市', value: form.city, type: 'select', options: ['杭州', '上海', '北京', '深圳'] },
        { field: 'level', label: '客户等级', value: form.level, type: 'select', options: ['普通', '重要', 'VIP'] },
      ] : [],
      buttons: currentPage === 'create' ? [
        { button: 'reset', text: '重置' },
        { button: 'save', text: '保存客户' },
      ] : [],
      savedResult,
    }),

    navigate_to: ({ page }: Record<string, string>) => {
      if (!['list', 'create', 'reports'].includes(page)) throw new Error(`unknown page: ${page}`);
      navigate(pageRoutes[page as AppPage]);
      return { ok: true, page, route: pageRoutes[page as AppPage], label: pageLabels[page as AppPage] };
    },

    fill_field: ({ field, value }: Record<string, string>) => {
      if (!['customerName', 'company', 'city', 'level'].includes(field)) throw new Error(`unknown field: ${field}`);
      setForm((prev) => ({ ...prev, [field]: value } as CustomerForm));
      return { ok: true, field, value };
    },

    select_option: ({ field, value }: Record<string, string>) => {
      if (field === 'city' && !['杭州', '上海', '北京', '深圳', ''].includes(value)) throw new Error(`invalid city: ${value}`);
      if (field === 'level' && !['普通', '重要', 'VIP'].includes(value)) throw new Error(`invalid level: ${value}`);
      setForm((prev) => ({ ...prev, [field]: value } as CustomerForm));
      return { ok: true, field, value };
    },

    click_button: ({ button }: Record<string, string>) => {
      if (button === 'reset') {
        setForm(initialForm);
        setSavedResult('已重置。');
        return { ok: true, button };
      }
      if (button === 'save') {
        const snapshot = { ...form };
        const output = JSON.stringify({ savedAt: new Date().toLocaleString(), ...snapshot }, null, 2);
        setSavedResult(output);
        return { ok: true, button, saved: snapshot };
      }
      throw new Error(`unknown button: ${button}`);
    },

    extract_state: () => ({ currentPage, ...form, savedResult }),
  };
}

export async function runCustomToolActions(params: {
  actions: ToolAction[];
  currentPage: AppPage;
  form: CustomerForm;
  savedResult: string;
  navigate: (path: string) => void;
  setForm: (form: CustomerForm) => void;
  setSavedResult: (result: string) => void;
  observe: () => unknown;
}) {
  const { actions, currentPage, form, savedResult, navigate, setForm, setSavedResult, observe } = params;
  let draftPage: AppPage = currentPage;
  let draft: CustomerForm = { ...form };
  let draftSavedResult = savedResult;
  const outputs: unknown[] = [];

  for (const action of actions) {
    const args = action.args || {};
    if (action.tool === 'observe_page') {
      outputs.push({ tool: action.tool, output: observe() });
    } else if (action.tool === 'navigate_to') {
      const page = args.page as AppPage;
      if (!['list', 'create', 'reports'].includes(page)) throw new Error(`unknown page: ${args.page}`);
      draftPage = page;
      outputs.push({ tool: action.tool, output: { ok: true, page, route: pageRoutes[page], label: pageLabels[page] } });
    } else if (action.tool === 'fill_field') {
      const field = args.field;
      const value = args.value ?? '';
      if (!['customerName', 'company', 'city', 'level'].includes(field)) throw new Error(`unknown field: ${field}`);
      draft = { ...draft, [field]: value } as CustomerForm;
      outputs.push({ tool: action.tool, output: { ok: true, field, value } });
    } else if (action.tool === 'select_option') {
      const field = args.field;
      const value = args.value ?? '';
      if (field === 'city' && !['杭州', '上海', '北京', '深圳', ''].includes(value)) throw new Error(`invalid city: ${value}`);
      if (field === 'level' && !['普通', '重要', 'VIP'].includes(value)) throw new Error(`invalid level: ${value}`);
      draft = { ...draft, [field]: value } as CustomerForm;
      outputs.push({ tool: action.tool, output: { ok: true, field, value } });
    } else if (action.tool === 'click_button') {
      const button = args.button;
      if (button === 'reset') {
        draft = initialForm;
        draftSavedResult = '已重置。';
        outputs.push({ tool: action.tool, output: { ok: true, button } });
      } else if (button === 'save') {
        draftSavedResult = JSON.stringify({ savedAt: new Date().toLocaleString(), ...draft }, null, 2);
        outputs.push({ tool: action.tool, output: { ok: true, button, saved: draft } });
      } else {
        throw new Error(`unknown button: ${button}`);
      }
    } else if (action.tool === 'extract_state') {
      outputs.push({ tool: action.tool, output: { currentPage: draftPage, ...draft, savedResult: draftSavedResult } });
    } else {
      throw new Error(`unknown tool: ${action.tool}`);
    }
  }

  navigate(pageRoutes[draftPage]);
  setForm(draft);
  setSavedResult(draftSavedResult);
  return outputs;
}
