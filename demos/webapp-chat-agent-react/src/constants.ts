import type { AppPage, CustomerForm } from './types';

export const DEFAULT_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL || 'https://napi.zwanan.top/v1';
export const DEFAULT_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'deepseek-v3.2';
export const DEFAULT_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export const initialForm: CustomerForm = {
  customerName: '',
  company: '',
  city: '',
  level: '普通',
};

export const pageLabels: Record<AppPage, string> = {
  list: '客户列表',
  create: '新建客户',
  reports: '数据报表',
};

export const pageRoutes: Record<AppPage, string> = {
  list: '/customers',
  create: '/customers/new',
  reports: '/reports',
};

export const routePages: Record<string, AppPage> = {
  '/customers': 'list',
  '/customers/new': 'create',
  '/reports': 'reports',
};

export const sampleCustomers = [
  { name: '李雷', company: '蚂蚁集团', city: '杭州', level: 'VIP' },
  { name: '王芳', company: '钉钉', city: '上海', level: '重要' },
  { name: '赵强', company: '菜鸟', city: '深圳', level: '普通' },
];
