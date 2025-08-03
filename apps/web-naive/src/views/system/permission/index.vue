<script lang="ts" setup>
import type { PermissionInfo, SystemStats } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { getPermissionsApi, getSystemStatsApi } from '#/api';

defineOptions({ name: 'PermissionManagement' });

const loading = ref(false);
const permissions = ref<PermissionInfo[]>([]);
const stats = ref<null | SystemStats>(null);

async function fetchData() {
  try {
    loading.value = true;
    const [permissionsResult, statsResult] = await Promise.all([
      getPermissionsApi(),
      getSystemStatsApi(),
    ]);
    permissions.value = permissionsResult;
    stats.value = statsResult;
  } catch (error) {
    console.error('Failed to fetch permission data:', error);
  } finally {
    loading.value = false;
  }
}

// Group permissions by resource
const groupedPermissions = computed(() => {
  const groups: Record<string, PermissionInfo[]> = {};

  for (const permission of permissions.value) {
    if (!groups[permission.resource]) {
      groups[permission.resource] = [];
    }
    groups[permission.resource].push(permission);
  }

  return Object.entries(groups).map(([resource, perms]) => ({
    resource,
    permissions: perms,
    count: perms.length,
  }));
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page
    description="Manage system permissions and access control"
    title="Permission Management"
  >
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div v-if="stats" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div class="bg-card rounded-lg border p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-muted-foreground text-sm font-medium">
                Total Users
              </p>
              <p class="text-2xl font-bold">{{ stats.totalUsers }}</p>
            </div>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100"
            >
              <svg
                class="h-4 w-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg border p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-muted-foreground text-sm font-medium">
                Active Users
              </p>
              <p class="text-2xl font-bold">{{ stats.activeUsers }}</p>
            </div>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100"
            >
              <svg
                class="h-4 w-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg border p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-muted-foreground text-sm font-medium">
                Total Roles
              </p>
              <p class="text-2xl font-bold">{{ stats.totalRoles }}</p>
            </div>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100"
            >
              <svg
                class="h-4 w-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg border p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-muted-foreground text-sm font-medium">
                Total Permissions
              </p>
              <p class="text-2xl font-bold">{{ stats.totalPermissions }}</p>
            </div>
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100"
            >
              <svg
                class="h-4 w-4 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Permissions by Resource -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Permissions by Resource</h3>

        <div v-if="loading" class="p-8 text-center">
          <div
            class="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          ></div>
          <p class="text-muted-foreground mt-2">Loading permissions...</p>
        </div>

        <div v-else class="grid gap-4">
          <div
            v-for="group in groupedPermissions"
            :key="group.resource"
            class="bg-card rounded-lg border"
          >
            <div class="border-b p-4">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold capitalize">{{ group.resource }}</h4>
                <span class="text-muted-foreground text-sm">
                  {{ group.count }} permissions
                </span>
              </div>
            </div>

            <div class="p-4">
              <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="permission in group.permissions"
                  :key="permission.id"
                  class="rounded-lg border p-3 transition-shadow hover:shadow-sm"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <h5 class="text-sm font-medium">{{ permission.name }}</h5>
                    <span
                      class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                    >
                      {{ permission.action }}
                    </span>
                  </div>

                  <p class="text-muted-foreground mb-2 text-xs">
                    {{ permission.description || 'No description provided' }}
                  </p>

                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="role in permission.roles"
                      :key="role"
                      class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-1 text-xs"
                    >
                      {{ role }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
