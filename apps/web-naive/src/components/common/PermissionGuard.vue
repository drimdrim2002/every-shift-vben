<script lang="ts" setup>
import { computed } from 'vue';

import { usePermissions } from '#/composables/use-permissions';

interface Props {
  action?: string;
  fallback?: boolean;
  permissions?: string[];
  resource?: string;
  roles?: string[];
  showFallback?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fallback: false,
  permissions: () => [],
  resource: '',
  action: '',
  roles: () => [],
  showFallback: true,
});

const { hasPermission, hasRole, hasAnyRole, hasResource, isAdmin } =
  usePermissions();

// Check if user has access based on provided criteria
const hasAccess = computed(() => {
  // Admin has access to everything
  if (isAdmin) return true;

  // Check role-based access
  if (props.roles.length > 0) {
    return hasAnyRole(props.roles);
  }

  // Check permission-based access
  if (props.permissions.length > 0) {
    return props.permissions.some((permission) => {
      if (permission.startsWith('role:')) {
        const role = permission.replace('role:', '');
        return hasRole(role);
      }
      return hasPermission(permission);
    });
  }

  // Check resource-based access
  if (props.resource) {
    return hasResource(props.resource, props.action);
  }

  // If no criteria specified, deny access
  return false;
});
</script>

<template>
  <div v-if="hasAccess">
    <slot></slot>
  </div>
  <div v-else-if="showFallback && $slots.fallback">
    <slot name="fallback"></slot>
  </div>
  <div v-else-if="showFallback && fallback" class="permission-denied">
    <div class="p-4 text-center">
      <div class="text-muted-foreground text-sm">
        You don't have permission to view this content.
      </div>
    </div>
  </div>
</template>

<style scoped>
.permission-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  background-color: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
}
</style>
