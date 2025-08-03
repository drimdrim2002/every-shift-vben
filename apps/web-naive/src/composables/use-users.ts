import type { Ref } from 'vue';

import type { CreateUserParams, UpdateUserParams, UserListParams } from '#/api';
import type { AuthUser } from '#/types/database';

import { computed, ref } from 'vue';

import {
  createUserApi,
  deleteUserApi,
  getUserListApi,
  toggleUserStatusApi,
  updateUserApi,
  updateUserRoleApi,
} from '#/api';

export interface UseUsersOptions {
  autoFetch?: boolean;
  initialParams?: UserListParams;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { autoFetch = true, initialParams = {} } = options;

  // State
  const loading = ref(false);
  const users = ref<AuthUser[]>([]);
  const total = ref(0);
  const error = ref<null | string>(null);

  // Pagination and search
  const currentPage = ref(1);
  const pageSize = ref(10);
  const searchParams = ref<UserListParams>({
    search: '',
    role: '',
    status: 'all',
    ...initialParams,
  });

  // Computed
  const hasUsers = computed(() => users.value.length > 0);
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPrevPage = computed(() => currentPage.value > 1);

  // Methods
  async function fetchUsers(params?: UserListParams) {
    try {
      loading.value = true;
      error.value = null;

      const queryParams = {
        ...searchParams.value,
        ...params,
        page: currentPage.value,
        pageSize: pageSize.value,
      };

      const result = await getUserListApi(queryParams);
      users.value = result.users;
      total.value = result.total;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : 'Failed to fetch users';
      console.error('Failed to fetch users:', error_);
    } finally {
      loading.value = false;
    }
  }

  async function createUser(params: CreateUserParams): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await createUserApi(params);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : 'Failed to create user';
      console.error('Failed to create user:', error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(
    userId: string,
    params: UpdateUserParams,
  ): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await updateUserApi(userId, params);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : 'Failed to update user';
      console.error('Failed to update user:', error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateUserRole(
    userId: string,
    role: string,
  ): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await updateUserRoleApi(userId, role);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : 'Failed to update user role';
      console.error('Failed to update user role:', error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function toggleUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await toggleUserStatusApi(userId, isActive);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error
          ? error_.message
          : 'Failed to toggle user status';
      console.error('Failed to toggle user status:', error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteUser(userId: string): Promise<boolean> {
    try {
      loading.value = true;
      error.value = null;

      await deleteUserApi(userId);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (error_) {
      error.value =
        error_ instanceof Error ? error_.message : 'Failed to delete user';
      console.error('Failed to delete user:', error_);
      return false;
    } finally {
      loading.value = false;
    }
  }

  function updateSearchParams(params: Partial<UserListParams>) {
    searchParams.value = { ...searchParams.value, ...params };
    currentPage.value = 1; // Reset to first page when searching
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      fetchUsers();
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      goToPage(currentPage.value + 1);
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      goToPage(currentPage.value - 1);
    }
  }

  function resetSearch() {
    searchParams.value = {
      search: '',
      role: '',
      status: 'all',
    };
    currentPage.value = 1;
    fetchUsers();
  }

  function refresh() {
    fetchUsers();
  }

  // Auto-fetch on creation if enabled
  if (autoFetch) {
    fetchUsers();
  }

  return {
    // State
    loading: loading as Ref<boolean>,
    users: users as Ref<AuthUser[]>,
    total: total as Ref<number>,
    error: error as Ref<null | string>,

    // Pagination
    currentPage: currentPage as Ref<number>,
    pageSize: pageSize as Ref<number>,
    searchParams: searchParams as Ref<UserListParams>,

    // Computed
    hasUsers,
    totalPages,
    hasNextPage,
    hasPrevPage,

    // Methods
    fetchUsers,
    createUser,
    updateUser,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    updateSearchParams,
    goToPage,
    nextPage,
    prevPage,
    resetSearch,
    refresh,
  };
}
