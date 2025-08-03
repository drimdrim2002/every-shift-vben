import type { App } from 'vue';

import { usePermissions } from '#/composables/use-permissions';

/**
 * Permission directive plugin
 */
export function setupPermissionDirective(app: App) {
  // v-permission directive for conditional rendering
  app.directive('permission', {
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
  });

  // v-role directive for role-based rendering
  app.directive('role', {
    mounted(el: HTMLElement, binding: { value: string | string[] }) {
      const { hasAnyRole } = usePermissions();
      const roles = Array.isArray(binding.value)
        ? binding.value
        : [binding.value];

      if (!hasAnyRole(roles)) {
        el.style.display = 'none';
      }
    },
    updated(el: HTMLElement, binding: { value: string | string[] }) {
      const { hasAnyRole } = usePermissions();
      const roles = Array.isArray(binding.value)
        ? binding.value
        : [binding.value];

      el.style.display = hasAnyRole(roles) ? '' : 'none';
    },
  });

  // v-admin directive for admin-only rendering
  app.directive('admin', {
    mounted(el: HTMLElement) {
      const { isAdmin } = usePermissions();
      if (!isAdmin) {
        el.style.display = 'none';
      }
    },
    updated(el: HTMLElement) {
      const { isAdmin } = usePermissions();
      el.style.display = isAdmin ? '' : 'none';
    },
  });
}
