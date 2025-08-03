import type { ComputedRef } from 'vue';

import { computed } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import { getPermissionsApi, getRolesApi } from '#/api';

export interface PermissionCheck {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasResource: (resource: string, action?: string) => boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
  canManageSystem: boolean;
  currentRoles: string[];
  currentPermissions: string[];
}

/**
 * Composable for permission and role-based access control
 */
export function usePermissions(): PermissionCheck {
  const userStore = useUserStore();
  const accessStore = useAccessStore();

  // Get current user roles
  const currentRoles: ComputedRef<string[]> = computed(() => {
    return userStore.userInfo?.roles || [];
  });

  // Get current user permissions from access codes
  const currentPermissions: ComputedRef<string[]> = computed(() => {
    return accessStore.accessCodes || [];
  });

  // Check if user is admin
  const isAdmin: ComputedRef<boolean> = computed(() => {
    return currentRoles.value.includes('admin');
  });

  // Check if user can manage users
  const canManageUsers: ComputedRef<boolean> = computed(() => {
    return (
      isAdmin.value ||
      currentRoles.value.includes('manager') ||
      currentPermissions.value.includes('user:manage')
    );
  });

  // Check if user can manage system
  const canManageSystem: ComputedRef<boolean> = computed(() => {
    return (
      isAdmin.value ||
      currentPermissions.value.includes('system:manage') ||
      currentPermissions.value.includes('role:manage') ||
      currentPermissions.value.includes('permission:manage')
    );
  });

  /**
   * Check if user has specific permission
   */
  function hasPermission(permission: string): boolean {
    if (isAdmin.value) return true;
    return currentPermissions.value.includes(permission);
  }

  /**
   * Check if user has specific role
   */
  function hasRole(role: string): boolean {
    return currentRoles.value.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  function hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => currentRoles.value.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  function hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => currentRoles.value.includes(role));
  }

  /**
   * Check if user has access to specific resource with optional action
   */
  function hasResource(resource: string, action?: string): boolean {
    if (isAdmin.value) return true;

    if (action) {
      return currentPermissions.value.includes(`${resource}:${action}`);
    }

    // Check if user has any permission for this resource
    return currentPermissions.value.some((permission) =>
      permission.startsWith(`${resource}:`),
    );
  }

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasResource,
    isAdmin: isAdmin.value,
    canManageUsers: canManageUsers.value,
    canManageSystem: canManageSystem.value,
    currentRoles: currentRoles.value,
    currentPermissions: currentPermissions.value,
  };
}

/**
 * Permission-based route guard
 */
export function createPermissionGuard(requiredPermissions: string[]) {
  return () => {
    const { hasPermission, hasAnyRole } = usePermissions();

    // Check if user has any of the required permissions
    const hasAccess = requiredPermissions.some((permission) => {
      // Check if it's a role check (format: role:rolename)
      if (permission.startsWith('role:')) {
        const role = permission.replace('role:', '');
        return hasAnyRole([role]);
      }
      // Check permission
      return hasPermission(permission);
    });

    return hasAccess;
  };
}

/**
 * Role-based route guard
 */
export function createRoleGuard(requiredRoles: string[]) {
  return () => {
    const { hasAnyRole } = usePermissions();
    return hasAnyRole(requiredRoles);
  };
}

/**
 * Admin-only route guard
 */
export function createAdminGuard() {
  return () => {
    const { isAdmin } = usePermissions();
    return isAdmin;
  };
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<T extends Record<string, any>>(
  component: T,
  permissions: string[],
): T {
  return {
    ...component,
    beforeCreate() {
      const { hasPermission, hasAnyRole } = usePermissions();

      const hasAccess = permissions.some((permission) => {
        if (permission.startsWith('role:')) {
          const role = permission.replace('role:', '');
          return hasAnyRole([role]);
        }
        return hasPermission(permission);
      });

      if (!hasAccess) {
        // Redirect to forbidden page or hide component
        this.$router?.push('/403');
        return false;
      }
    },
  } as T;
}

/**
 * Directive for conditional rendering based on permissions
 */
export const vPermission = {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const { hasPermission, hasAnyRole } = usePermissions();
    const permissions = Array.isArray(binding.value)
      ? binding.value
      : [binding.value];

    const hasAccess = permissions.some((permission) => {
      if (permission.startsWith('role:')) {
        const role = permission.replace('role:', '');
        return hasAnyRole([role]);
      }
      return hasPermission(permission);
    });

    if (!hasAccess) {
      el.style.display = 'none';
    }
  },
  updated(el: HTMLElement, binding: { value: string | string[] }) {
    const { hasPermission, hasAnyRole } = usePermissions();
    const permissions = Array.isArray(binding.value)
      ? binding.value
      : [binding.value];

    const hasAccess = permissions.some((permission) => {
      if (permission.startsWith('role:')) {
        const role = permission.replace('role:', '');
        return hasAnyRole([role]);
      }
      return hasPermission(permission);
    });

    el.style.display = hasAccess ? '' : 'none';
  },
};

/**
 * Async permission loader for complex permission checks
 */
export async function loadUserPermissions(_userId?: string) {
  try {
    const [roles, permissions] = await Promise.all([
      getRolesApi(),
      getPermissionsApi(),
    ]);

    return {
      roles,
      permissions,
      success: true,
    };
  } catch (error) {
    console.error('Failed to load user permissions:', error);
    return {
      roles: [],
      permissions: [],
      success: false,
      error,
    };
  }
}
