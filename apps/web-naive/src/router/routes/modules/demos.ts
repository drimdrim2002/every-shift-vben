import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: $t('demos.title'),
    },
    name: 'Demos',
    path: '/demos',
    children: [
      {
        meta: {
          title: $t('demos.naive'),
        },
        name: 'NaiveDemos',
        path: '/demos/naive',
        component: () => import('#/views/demos/naive/index.vue'),
      },
      {
        meta: {
          title: $t('demos.table'),
        },
        name: 'Table',
        path: '/demos/table',
        component: () => import('#/views/demos/table/index.vue'),
      },
      {
        meta: {
          title: $t('demos.form'),
        },
        name: 'Form',
        path: '/demos/form',
        component: () => import('#/views/demos/form/basic.vue'),
      },
      {
        meta: {
          title: 'Supabase API Test',
        },
        name: 'SupabaseTest',
        path: '/demos/supabase-test',
        component: () => import('#/views/examples/supabase-test.vue'),
      },
    ],
  },
];

export default routes;
