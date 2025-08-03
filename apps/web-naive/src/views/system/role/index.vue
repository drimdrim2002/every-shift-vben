<script lang="ts" setup>
import type { PermissionInfo, RoleInfo } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { getPermissionsApi, getRolesApi } from '#/api';

defineOptions({ name: 'RoleManagement' });

const loading = ref(false);
const roles = ref<RoleInfo[]>([]);
const permissions = ref<PermissionInfo[]>([]);

async function fetchData() {
  try {
    loading.value = true;
    const [rolesResult, permissionsResult] = await Promise.all([
      getRolesApi(),
      getPermissionsApi(),
    ]);
    roles.value = rolesResult;
    permissions.value = permissionsResult;
  } catch (error) {
    console.error('Failed to fetch role data:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page
    description="Manage system roles and their permissions"
    title="Role Management"
  >
    <div class="space-y-6">
      <!-- Roles Section -->
      <div class="bg-card rounded-lg border">
        <div class="border-b p-4">
          <h3 class="text-lg font-semibold">System Roles</h3>
        </div>

        <div v-if="loading" class="p-8 text-center">
          <div
            class="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          ></div>
          <p class="text-muted-foreground mt-2">Loading roles...</p>
        </div>

        <div v-else class="p-4">
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="role in roles"
              :key="role.role"
              class="rounded-lg border p-4 transition-shadow hover:shadow-md"
            >
              <div class="mb-2 flex items-center justify-between">
                <h4 class="font-semibold capitalize">{{ role.role }}</h4>
                <span class="text-muted-foreground text-sm">
                  {{ role.userCount }} users
                </span>
              </div>
              <p class="text-muted-foreground mb-3 text-sm">
                {{ role.description }}
              </p>
              <div class="space-y-1">
                <p class="text-muted-foreground text-xs font-medium">
                  Permissions ({{ role.permissions.length }}):
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="permission in role.permissions.slice(0, 3)"
                    :key="permission"
                    class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-1 text-xs"
                  >
                    {{ permission }}
                  </span>
                  <span
                    v-if="role.permissions.length > 3"
                    class="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-xs"
                  >
                    +{{ role.permissions.length - 3 }} more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permissions Section -->
      <div class="bg-card rounded-lg border">
        <div class="border-b p-4">
          <h3 class="text-lg font-semibold">Available Permissions</h3>
        </div>

        <div v-if="loading" class="p-8 text-center">
          <div
            class="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          ></div>
          <p class="text-muted-foreground mt-2">Loading permissions...</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-4 py-3 text-left">Permission</th>
                <th class="px-4 py-3 text-left">Resource</th>
                <th class="px-4 py-3 text-left">Action</th>
                <th class="px-4 py-3 text-left">Roles</th>
                <th class="px-4 py-3 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="permission in permissions"
                :key="permission.id"
                class="hover:bg-muted/50 border-b"
              >
                <td class="px-4 py-3 font-medium">{{ permission.name }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                  >
                    {{ permission.resource }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                  >
                    {{ permission.action }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="role in permission.roles"
                      :key="role"
                      class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-1 text-xs"
                    >
                      {{ role }}
                    </span>
                  </div>
                </td>
                <td class="text-muted-foreground px-4 py-3 text-sm">
                  {{ permission.description || 'No description' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Page>
</template>
