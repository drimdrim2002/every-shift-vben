import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      keepAlive: true,
      order: 900,
      title: 'System Management',
      // System management requires admin or manager role
      authority: ['admin', 'manager'],
    },
    name: 'System',
    path: '/system',
    children: [
      {
        meta: {
          title: 'User Management',
          icon: 'lucide:users',
          // User management requires admin or manager role, or specific permission
          authority: ['admin', 'manager', 'user:manage'],
        },
        name: 'UserManagement',
        path: '/system/user',
        component: () => import('#/views/system/user/index.vue'),
      },
      {
        meta: {
          title: 'Role Management',
          icon: 'lucide:shield',
          // Role management requires admin role or specific permission
          authority: ['admin', 'role:manage'],
        },
        name: 'RoleManagement',
        path: '/system/role',
        component: () => import('#/views/system/role/index.vue'),
      },
      {
        meta: {
          title: 'Permission Management',
          icon: 'lucide:key',
          // Permission management requires admin role only
          authority: ['admin'],
        },
        name: 'PermissionManagement',
        path: '/system/permission',
        component: () => import('#/views/system/permission/index.vue'),
      },
    ],
  },
];

export default routes;
