<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import type { UserListParams } from '#/api';
import type { AuthUser } from '#/types/database';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getUserListApi } from '#/api';
import { usePermissions } from '#/composables/use-permissions';

defineOptions({ name: 'UserManagement' });

// Permissions
const { canManageUsers, hasPermission, isAdmin } = usePermissions();

// State
const loading = ref(false);
const users = ref<AuthUser[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// Search and filters
const searchForm = ref<UserListParams>({
  search: '',
  role: '',
  status: 'all',
});

// Available options
const roleOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Employee', value: 'employee' },
];

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

// Form schema for search
const searchSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInput',
    componentProps: {
      placeholder: 'Search by name, username, or email',
    },
    fieldName: 'search',
    label: 'Search',
  },
  {
    component: 'VbenSelect',
    componentProps: {
      options: roleOptions,
    },
    fieldName: 'role',
    label: 'Role',
  },
  {
    component: 'VbenSelect',
    componentProps: {
      options: statusOptions,
    },
    fieldName: 'status',
    label: 'Status',
  },
]);

// Methods
async function fetchUsers() {
  try {
    loading.value = true;
    const params = {
      ...searchForm.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };

    const result = await getUserListApi(params);
    users.value = result.users;
    total.value = result.total;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    loading.value = false;
  }
}

// Role change function - will implement when needed
// async function handleRoleChange(userId: string, newRole: string) {
//   try {
//     await updateUserRoleApi(userId, newRole);
//     await fetchUsers(); // Refresh the list
//   } catch (error) {
//     console.error('Failed to update user role:', error);
//   }
// }

function handleSearch() {
  currentPage.value = 1;
  fetchUsers();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchUsers();
}

function getUserRoles(user: AuthUser): string {
  return user.roles?.map((r) => r.role).join(', ') || 'No roles';
}

function getUserStatus(user: AuthUser): string {
  return user.profile?.is_active ? 'Active' : 'Inactive';
}

// Lifecycle
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <Page
    :description="$t('page.system.userManagement.description')"
    :title="$t('page.system.userManagement.title')"
  >
    <!-- Search Form -->
    <div class="bg-card mb-6 rounded-lg border p-4">
      <h3 class="mb-4 text-lg font-semibold">Search & Filter</h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div v-for="field in searchSchema" :key="field.fieldName">
          <label :for="field.fieldName" class="mb-2 block text-sm font-medium">
            {{ field.label }}
          </label>
          <component
            :is="field.component"
            :id="field.fieldName"
            v-model="(searchForm as any)[field.fieldName]"
            v-bind="field.componentProps"
            class="w-full"
          />
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <button
          type="button"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          @click="handleSearch"
        >
          Search
        </button>
        <button
          type="button"
          class="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-4 py-2"
          @click="
            searchForm = { search: '', role: '', status: 'all' };
            handleSearch();
          "
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-card rounded-lg border">
      <div class="border-b p-4">
        <h3 class="text-lg font-semibold">Users ({{ total }})</h3>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <div
          class="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
        ></div>
        <p class="text-muted-foreground mt-2">Loading users...</p>
      </div>

      <div
        v-else-if="users.length === 0"
        class="text-muted-foreground p-8 text-center"
      >
        No users found
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-3 text-left">User</th>
              <th class="px-4 py-3 text-left">Email</th>
              <th class="px-4 py-3 text-left">Role</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-left">Last Updated</th>
              <th class="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-muted/50 border-b"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full"
                  >
                    <span class="text-sm font-medium">
                      {{ user.profile?.full_name?.charAt(0) || 'U' }}
                    </span>
                  </div>
                  <div>
                    <div class="font-medium">
                      {{ user.profile?.full_name || 'No name' }}
                    </div>
                    <div class="text-muted-foreground text-sm">
                      @{{ user.profile?.username || 'no-username' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span
                  class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                >
                  {{ getUserRoles(user) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                  :class="[
                    user.profile?.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                  ]"
                >
                  {{ getUserStatus(user) }}
                </span>
              </td>
              <td class="text-muted-foreground px-4 py-3 text-sm">
                {{
                  new Date(user.profile?.updated_at || '').toLocaleDateString()
                }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button
                    v-if="canManageUsers || hasPermission('user:update')"
                    class="text-primary hover:text-primary/80 text-sm"
                    @click="() => {}"
                  >
                    Edit
                  </button>
                  <button
                    v-if="isAdmin || hasPermission('user:delete')"
                    class="text-destructive hover:text-destructive/80 text-sm"
                    @click="() => {}"
                  >
                    Delete
                  </button>
                  <span
                    v-if="
                      !canManageUsers &&
                      !hasPermission('user:update') &&
                      !hasPermission('user:delete')
                    "
                    class="text-muted-foreground text-sm"
                  >
                    No actions available
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="total > pageSize"
        class="flex items-center justify-between border-t p-4"
      >
        <div class="text-muted-foreground text-sm">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to
          {{ Math.min(currentPage * pageSize, total) }} of {{ total }} results
        </div>
        <div class="flex gap-2">
          <button
            :disabled="currentPage <= 1"
            class="rounded border px-3 py-1 text-sm disabled:opacity-50"
            @click="handlePageChange(currentPage - 1)"
          >
            Previous
          </button>
          <button
            :disabled="currentPage >= Math.ceil(total / pageSize)"
            class="rounded border px-3 py-1 text-sm disabled:opacity-50"
            @click="handlePageChange(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </Page>
</template>
