/**
The routing of this file will not show the layout.
It is an independent new page.
the contents of the file still need to log in to access
 */
import type { AppRouteModule } from '/@/router/types';

// test
// http:ip:port/main-out
export const mainOutRoutes: AppRouteModule[] = [
  {
    path: '/main-out',
    name: 'MainOut',
    component: () => import('/@/views/demo/main-out/index.vue'),
    meta: {
      title: 'MainOut',
      ignoreAuth: true,
    },
  },
  {
    path: '/page-agent-portal',
    name: 'PageAgentPortal',
    component: () => import('/@/views/page-agent-portal/Portal.vue'),
    meta: {
      title: 'PageAgent 门户测试',
      ignoreAuth: true,
    },
  },
  {
    path: '/page-agent-app-a',
    name: 'PageAgentSpaAppA',
    component: () => import('/@/views/page-agent-portal/SpaAppA.vue'),
    meta: {
      title: 'SPA 应用 A',
      ignoreAuth: true,
    },
  },
  {
    path: '/page-agent-app-b',
    name: 'PageAgentSpaAppB',
    component: () => import('/@/views/page-agent-portal/SpaAppB.vue'),
    meta: {
      title: 'SPA 应用 B',
      ignoreAuth: true,
    },
  },
  {
    path: '/page-agent-iframe-shell',
    name: 'PageAgentIframeShell',
    component: () => import('/@/views/page-agent-portal/IframeShell.vue'),
    meta: {
      title: 'iframe 应用测试',
      ignoreAuth: true,
    },
  },
];

export const mainOutRouteNames = mainOutRoutes.map((item) => item.name);
