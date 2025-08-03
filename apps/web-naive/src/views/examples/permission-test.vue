<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import PermissionGuard from '#/components/common/PermissionGuard.vue';
import { usePermissions } from '#/composables/use-permissions';
import {
  createTestUsers,
  getCurrentUserInfo,
  logTestInstructions,
  resetTestUsers,
  TEST_USERS,
} from '#/utils/test-users';

defineOptions({ name: 'PermissionTest' });

const {
  hasPermission,
  hasRole,
  hasAnyRole,
  hasResource,
  isAdmin,
  canManageUsers,
  canManageSystem,
} = usePermissions();

const loading = ref(false);
const userInfo = ref<any>(null);
const testResults = ref<any[]>([]);

async function handleCreateTestUsers() {
  loading.value = true;
  try {
    const results = await createTestUsers();
    testResults.value = results;
    console.warn('Test users creation results:', results);
  } catch (error) {
    console.error('Failed to create test users:', error);
  } finally {
    loading.value = false;
  }
}

async function handleResetTestUsers() {
  loading.value = true;
  try {
    const results = await resetTestUsers();
    testResults.value = results;
    console.warn('Test users reset results:', results);
  } catch (error) {
    console.error('Failed to reset test users:', error);
  } finally {
    loading.value = false;
  }
}

async function handleGetUserInfo() {
  loading.value = true;
  try {
    const info = await getCurrentUserInfo();
    userInfo.value = info;
    console.warn('Current user info:', info);
  } catch (error) {
    console.error('Failed to get user info:', error);
  } finally {
    loading.value = false;
  }
}

function handleShowInstructions() {
  logTestInstructions();
}

onMounted(() => {
  handleGetUserInfo();
  handleShowInstructions();
});
</script>

<template>
  <Page
    description="Test the permission and access control system"
    title="Permission System Test"
  >
    <div class="space-y-6">
      <!-- Current User Info -->
      <div class="bg-card rounded-lg border p-6">
        <h3 class="mb-4 text-lg font-semibold">Current User Information</h3>

        <div class="mb-4 flex gap-2">
          <button
            :disabled="loading"
            class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
            @click="handleGetUserInfo"
          >
            Refresh User Info
          </button>
        </div>

        <div v-if="userInfo?.user" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 class="font-medium">Basic Info:</h4>
              <ul class="text-muted-foreground mt-2 space-y-1 text-sm">
                <li><strong>Email:</strong> {{ userInfo.user.email }}</li>
                <li>
                  <strong>Name:</strong>
                  {{ userInfo.user.profile?.full_name || 'N/A' }}
                </li>
                <li>
                  <strong>Username:</strong>
                  {{ userInfo.user.profile?.username || 'N/A' }}
                </li>
                <li>
                  <strong>Active:</strong>
                  {{ userInfo.user.profile?.is_active ? 'Yes' : 'No' }}
                </li>
              </ul>
            </div>

            <div>
              <h4 class="font-medium">Permissions Status:</h4>
              <ul class="text-muted-foreground mt-2 space-y-1 text-sm">
                <li>
                  <strong>Is Admin:</strong> {{ isAdmin ? '✅ Yes' : '❌ No' }}
                </li>
                <li>
                  <strong>Can Manage Users:</strong>
                  {{ canManageUsers ? '✅ Yes' : '❌ No' }}
                </li>
                <li>
                  <strong>Can Manage System:</strong>
                  {{ canManageSystem ? '✅ Yes' : '❌ No' }}
                </li>
              </ul>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 class="font-medium">Roles:</h4>
              <div class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="role in userInfo.user.roles"
                  :key="role"
                  class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                >
                  {{ role }}
                </span>
                <span
                  v-if="userInfo.user.roles.length === 0"
                  class="text-muted-foreground text-sm"
                >
                  No roles assigned
                </span>
              </div>
            </div>

            <div>
              <h4 class="font-medium">Permissions:</h4>
              <div class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="permission in userInfo.user.permissions.slice(0, 5)"
                  :key="permission"
                  class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                >
                  {{ permission }}
                </span>
                <span
                  v-if="userInfo.user.permissions.length > 5"
                  class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  +{{ userInfo.user.permissions.length - 5 }} more
                </span>
                <span
                  v-if="userInfo.user.permissions.length === 0"
                  class="text-muted-foreground text-sm"
                >
                  No permissions assigned
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="userInfo?.error" class="text-destructive">
          Error: {{ userInfo.error }}
        </div>
      </div>

      <!-- Permission Tests -->
      <div class="bg-card rounded-lg border p-6">
        <h3 class="mb-4 text-lg font-semibold">Permission Function Tests</h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <!-- Role Tests -->
          <div class="space-y-2">
            <h4 class="font-medium">Role Tests:</h4>
            <div class="space-y-1 text-sm">
              <div>hasRole('admin'): {{ hasRole('admin') ? '✅' : '❌' }}</div>
              <div>
                hasRole('manager'): {{ hasRole('manager') ? '✅' : '❌' }}
              </div>
              <div>
                hasRole('employee'): {{ hasRole('employee') ? '✅' : '❌' }}
              </div>
              <div>
                hasAnyRole(['admin', 'manager']):
                {{ hasAnyRole(['admin', 'manager']) ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <!-- Permission Tests -->
          <div class="space-y-2">
            <h4 class="font-medium">Permission Tests:</h4>
            <div class="space-y-1 text-sm">
              <div>
                hasPermission('user:manage'):
                {{ hasPermission('user:manage') ? '✅' : '❌' }}
              </div>
              <div>
                hasPermission('user:read'):
                {{ hasPermission('user:read') ? '✅' : '❌' }}
              </div>
              <div>
                hasPermission('role:manage'):
                {{ hasPermission('role:manage') ? '✅' : '❌' }}
              </div>
              <div>
                hasPermission('system:admin'):
                {{ hasPermission('system:admin') ? '✅' : '❌' }}
              </div>
            </div>
          </div>

          <!-- Resource Tests -->
          <div class="space-y-2">
            <h4 class="font-medium">Resource Tests:</h4>
            <div class="space-y-1 text-sm">
              <div>
                hasResource('user'): {{ hasResource('user') ? '✅' : '❌' }}
              </div>
              <div>
                hasResource('user', 'manage'):
                {{ hasResource('user', 'manage') ? '✅' : '❌' }}
              </div>
              <div>
                hasResource('system'): {{ hasResource('system') ? '✅' : '❌' }}
              </div>
              <div>
                hasResource('reports', 'read'):
                {{ hasResource('reports', 'read') ? '✅' : '❌' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Test User Management -->
      <div class="bg-card rounded-lg border p-6">
        <h3 class="mb-4 text-lg font-semibold">Test User Management</h3>

        <div class="mb-4 flex flex-wrap gap-2">
          <button
            :disabled="loading"
            class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
            @click="handleCreateTestUsers"
          >
            Create Test Users
          </button>
          <button
            :disabled="loading"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-4 py-2 disabled:opacity-50"
            @click="handleResetTestUsers"
          >
            Reset Test Users
          </button>
          <button
            class="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2"
            @click="handleShowInstructions"
          >
            Show Test Instructions
          </button>
        </div>

        <!-- Test Users Info -->
        <div class="mb-4">
          <h4 class="mb-2 font-medium">Available Test Users:</h4>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div
              v-for="(user, type) in TEST_USERS"
              :key="type"
              class="rounded-lg border p-3"
            >
              <h5 class="font-medium">{{ type }}</h5>
              <div class="text-muted-foreground mt-1 space-y-1 text-sm">
                <div><strong>Email:</strong> {{ user.email }}</div>
                <div><strong>Password:</strong> {{ user.password }}</div>
                <div><strong>Role:</strong> {{ user.role }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Test Results -->
        <div v-if="testResults.length > 0" class="mt-4">
          <h4 class="mb-2 font-medium">Test Results:</h4>
          <div class="space-y-2">
            <div
              v-for="result in testResults"
              :key="result.userType"
              class="flex items-center justify-between rounded border p-2"
              :class="[
                result.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50',
              ]"
            >
              <span class="font-medium">{{ result.userType }}</span>
              <span
                :class="[result.success ? 'text-green-600' : 'text-red-600']"
              >
                {{ result.success ? '✅ Success' : '❌ Failed' }}
                {{ result.error ? `- ${result.error}` : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission-Based Rendering Tests -->
      <div class="bg-card rounded-lg border p-6">
        <h3 class="mb-4 text-lg font-semibold">
          Permission-Based Rendering Tests
        </h3>

        <div class="space-y-4">
          <!-- Using v-permission directive -->
          <div>
            <h4 class="mb-2 font-medium">Directive Tests:</h4>
            <div class="space-y-2">
              <div
                v-permission="'user:manage'"
                class="rounded bg-green-100 p-2 text-green-800"
              >
                ✅ You can see this because you have 'user:manage' permission
              </div>
              <div
                v-permission="'role:admin'"
                class="rounded bg-blue-100 p-2 text-blue-800"
              >
                ✅ You can see this because you have 'role:admin' permission
              </div>
              <div
                v-role="'admin'"
                class="rounded bg-purple-100 p-2 text-purple-800"
              >
                ✅ You can see this because you have 'admin' role
              </div>
              <div v-admin class="rounded bg-yellow-100 p-2 text-yellow-800">
                ✅ You can see this because you are an admin
              </div>
            </div>
          </div>

          <!-- Using PermissionGuard component -->
          <div>
            <h4 class="mb-2 font-medium">Component Tests:</h4>
            <div class="space-y-2">
              <PermissionGuard :permissions="['user:manage']">
                <div class="rounded bg-green-100 p-2 text-green-800">
                  ✅ PermissionGuard: You have user management permission
                </div>
              </PermissionGuard>

              <PermissionGuard :roles="['manager']" :show-fallback="true">
                <div class="rounded bg-blue-100 p-2 text-blue-800">
                  ✅ PermissionGuard: You are a manager
                </div>
                <template #fallback>
                  <div class="rounded bg-gray-100 p-2 text-gray-600">
                    ❌ You are not a manager
                  </div>
                </template>
              </PermissionGuard>

              <PermissionGuard
                resource="system"
                action="admin"
                :fallback="true"
              >
                <div class="rounded bg-purple-100 p-2 text-purple-800">
                  ✅ PermissionGuard: You have system admin access
                </div>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
