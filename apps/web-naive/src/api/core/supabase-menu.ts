import type { RouteRecordStringComponent } from '@vben/types';

import { authUtils, getCompleteUserData } from '#/lib/supabase-utils';

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  component?: string;
  meta?: {
    hideInMenu?: boolean;
    icon?: string;
    keepAlive?: boolean;
    permissions?: string[];
    requiresAuth?: boolean;
    roles?: string[];
    title: string;
  };
  children?: MenuItem[];
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all menus for the current user based on their roles and permissions
 */
export async function supabaseGetAllMenusApi(): Promise<
  RouteRecordStringComponent[]
> {
  try {
    // Get current user with complete data including roles and permissions
    const { data: userData, error: userError } =
      await authUtils.getCurrentUser();

    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const { user: completeUser, error: completeUserError } =
      await getCompleteUserData(userData.user.id);

    if (completeUserError || !completeUser) {
      throw new Error('Failed to get user data');
    }

    const userRoles = completeUser.roles.map((role) => role.role);
    const userPermissions = completeUser.permissions.map((perm) => perm.name);

    console.warn('User roles for menu generation:', userRoles);
    console.warn('User permissions for menu generation:', userPermissions);

    // Generate menu based on user roles and permissions
    const menus = generatePermissionBasedMenus(userRoles, userPermissions);

    // Sort menus by order
    return menus.sort((a, b) => (a.meta?.order || 0) - (b.meta?.order || 0));
  } catch (error) {
    console.error('Failed to get user menus:', error);
    return getDefaultMenus(); // Fallback to basic menus
  }
}

/**
 * Generate menus based on user permissions and roles
 */
function generatePermissionBasedMenus(
  roles: string[],
  permissions: string[],
): RouteRecordStringComponent[] {
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');

  const menus: RouteRecordStringComponent[] = [];

  // Dashboard - available to all authenticated users
  menus.push({
    name: 'Dashboard',
    path: '/dashboard',
    component: '/views/dashboard/index.vue',
    meta: {
      title: 'Dashboard',
      icon: 'lucide:layout-dashboard',
      order: 1,
    },
  });

  // System Management - requires admin or manager role, or specific permissions
  if (
    isAdmin ||
    isManager ||
    permissions.some((p) => p.includes('system:')) ||
    permissions.includes('user:manage')
  ) {
    const systemChildren: RouteRecordStringComponent[] = [];

    // User Management
    if (
      isAdmin ||
      isManager ||
      permissions.includes('user:manage') ||
      permissions.includes('user:read')
    ) {
      systemChildren.push({
        name: 'UserManagement',
        path: '/system/user',
        component: '/views/system/user/index.vue',
        meta: {
          title: 'User Management',
          icon: 'lucide:users',
          authority: ['admin', 'manager', 'user:manage'],
        },
      });
    }

    // Role Management
    if (isAdmin || permissions.includes('role:manage')) {
      systemChildren.push({
        name: 'RoleManagement',
        path: '/system/role',
        component: '/views/system/role/index.vue',
        meta: {
          title: 'Role Management',
          icon: 'lucide:shield',
          authority: ['admin', 'role:manage'],
        },
      });
    }

    // Permission Management - admin only
    if (isAdmin) {
      systemChildren.push({
        name: 'PermissionManagement',
        path: '/system/permission',
        component: '/views/system/permission/index.vue',
        meta: {
          title: 'Permission Management',
          icon: 'lucide:key',
          authority: ['admin'],
        },
      });
    }

    if (systemChildren.length > 0) {
      menus.push({
        name: 'SystemManagement',
        path: '/system',
        meta: {
          title: 'System Management',
          icon: 'lucide:settings',
          order: 100,
          authority: ['admin', 'manager'],
        },
        children: systemChildren,
      });
    }
  }

  // Analytics - admin only or with specific permission
  if (isAdmin || permissions.includes('analytics:read')) {
    menus.push({
      name: 'Analytics',
      path: '/analytics',
      component: '/views/analytics/index.vue',
      meta: {
        title: 'Analytics',
        icon: 'lucide:bar-chart',
        order: 90,
        authority: ['admin', 'analytics:read'],
      },
    });
  }

  // Reports - manager and admin, or with specific permission
  if (isAdmin || isManager || permissions.includes('reports:read')) {
    menus.push({
      name: 'Reports',
      path: '/reports',
      component: '/views/reports/index.vue',
      meta: {
        title: 'Reports',
        icon: 'lucide:file-text',
        order: 80,
        authority: ['admin', 'manager', 'reports:read'],
      },
    });
  }

  // Team Management - manager and admin, or with specific permission
  if (isAdmin || isManager || permissions.includes('team:manage')) {
    menus.push({
      name: 'TeamManagement',
      path: '/team',
      component: '/views/team/index.vue',
      meta: {
        title: 'Team Management',
        icon: 'lucide:users-2',
        order: 70,
        authority: ['admin', 'manager', 'team:manage'],
      },
    });
  }

  // Examples and Development (available to all users for testing)
  menus.push(
    {
      name: 'Examples',
      path: '/examples',
      meta: {
        title: 'Examples',
        icon: 'lucide:layers',
        order: 150,
      },
      children: [
        {
          name: 'SupabaseTest',
          path: '/examples/supabase-test',
          component: '/views/examples/supabase-test.vue',
          meta: {
            title: 'Supabase API Test',
            icon: 'lucide:database',
          },
        },
        {
          name: 'PermissionTest',
          path: '/examples/permission-test',
          component: '/views/examples/permission-test.vue',
          meta: {
            title: 'Permission System Test',
            icon: 'lucide:shield-check',
          },
        },
      ],
    },
    {
      name: 'Profile',
      path: '/profile',
      component: '/views/profile/index.vue',
      meta: {
        title: 'Profile',
        icon: 'lucide:user',
        order: 200,
      },
    },
    {
      name: 'Settings',
      path: '/settings',
      component: '/views/settings/index.vue',
      meta: {
        title: 'Settings',
        icon: 'lucide:settings',
        order: 210,
      },
    },
  );

  return menus;
}

/**
 * Get default menus when user data is unavailable
 */
function getDefaultMenus(): RouteRecordStringComponent[] {
  return [
    {
      name: 'Dashboard',
      path: '/dashboard',
      component: '/views/dashboard/index.vue',
      meta: {
        title: 'Dashboard',
        icon: 'lucide:layout-dashboard',
        order: 1,
      },
    },
    {
      name: 'Profile',
      path: '/profile',
      component: '/views/profile/index.vue',
      meta: {
        title: 'Profile',
        icon: 'lucide:user',
        order: 200,
      },
    },
  ];
}

/**
 * Create a new menu item (admin only)
 */
export async function createMenuApi(
  menu: Omit<MenuItem, 'created_at' | 'id' | 'updated_at'>,
) {
  // This would create a menu in a menus table
  // For now, just return success as we're using static menus
  return { success: true, menu };
}

/**
 * Update a menu item (admin only)
 */
export async function updateMenuApi(id: string, updates: Partial<MenuItem>) {
  // This would update a menu in a menus table
  // For now, just return success as we're using static menus
  return { success: true, menu: { id, ...updates } };
}

/**
 * Delete a menu item (admin only)
 */
export async function deleteMenuApi(id: string) {
  // This would delete a menu from a menus table
  // For now, just return success as we're using static menus
  return { success: true, id };
}

/**
 * Check if user has access to a specific menu
 */
export async function checkMenuAccessApi(menuPath: string): Promise<boolean> {
  try {
    const menus = await supabaseGetAllMenusApi();

    // Check if menu path exists in user's accessible menus
    const hasAccess = (menuList: RouteRecordStringComponent[]): boolean => {
      for (const menu of menuList) {
        if (menu.path === menuPath) {
          return true;
        }
        if (menu.children && hasAccess(menu.children)) {
          return true;
        }
      }
      return false;
    };

    return hasAccess(menus);
  } catch {
    return false;
  }
}
