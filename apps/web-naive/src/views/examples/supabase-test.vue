<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  getPermissionsApi,
  getRolesApi,
  getSystemStatsApi,
  supabaseGetAllMenusApi,
  supabaseGetUserInfoApi,
} from '#/api';

defineOptions({ name: 'SupabaseTest' });

// State
const loading = ref(false);
const results = ref<Record<string, any>>({});
const errors = ref<Record<string, string>>({});

// Test functions
const tests = [
  {
    name: 'User Info',
    key: 'userInfo',
    fn: supabaseGetUserInfoApi,
  },
  {
    name: 'All Menus',
    key: 'menus',
    fn: supabaseGetAllMenusApi,
  },
  {
    name: 'Roles',
    key: 'roles',
    fn: getRolesApi,
  },
  {
    name: 'Permissions',
    key: 'permissions',
    fn: getPermissionsApi,
  },
  {
    name: 'System Stats',
    key: 'stats',
    fn: getSystemStatsApi,
  },
];

async function runTest(test: (typeof tests)[0]) {
  try {
    loading.value = true;
    const result = await test.fn();
    results.value[test.key] = result;
    delete errors.value[test.key];
  } catch (error) {
    errors.value[test.key] =
      error instanceof Error ? error.message : 'Unknown error';
    delete results.value[test.key];
  } finally {
    loading.value = false;
  }
}

async function runAllTests() {
  loading.value = true;
  results.value = {};
  errors.value = {};

  for (const test of tests) {
    try {
      const result = await test.fn();
      results.value[test.key] = result;
    } catch (error) {
      errors.value[test.key] =
        error instanceof Error ? error.message : 'Unknown error';
    }
  }

  loading.value = false;
}

onMounted(() => {
  runAllTests();
});
</script>

<template>
  <Page description="Test Supabase API integrations" title="Supabase API Test">
    <div class="space-y-6">
      <!-- Controls -->
      <div class="flex gap-4">
        <button
          :disabled="loading"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50"
          @click="runAllTests"
        >
          {{ loading ? 'Testing...' : 'Run All Tests' }}
        </button>
      </div>

      <!-- Test Results -->
      <div class="grid gap-6">
        <div
          v-for="test in tests"
          :key="test.key"
          class="rounded-lg border p-4"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ test.name }}</h3>
            <div class="flex gap-2">
              <button
                class="hover:bg-accent rounded border px-3 py-1 text-sm"
                @click="runTest(test)"
              >
                Test
              </button>
              <div
                class="rounded px-2 py-1 text-xs font-medium"
                :class="[
                  results[test.key]
                    ? 'bg-green-100 text-green-800'
                    : errors[test.key]
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800',
                ]"
              >
                {{
                  results[test.key]
                    ? 'Success'
                    : errors[test.key]
                      ? 'Error'
                      : 'Not tested'
                }}
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="errors[test.key]"
            class="mb-4 rounded-md border border-red-200 bg-red-50 p-3"
          >
            <p class="text-sm text-red-800">
              <strong>Error:</strong> {{ errors[test.key] }}
            </p>
          </div>

          <!-- Success Result -->
          <div
            v-if="results[test.key]"
            class="rounded-md border border-green-200 bg-green-50 p-3"
          >
            <p class="mb-2 text-sm font-medium text-green-800">Result:</p>
            <pre class="max-h-64 overflow-auto text-xs text-green-700">{{
              JSON.stringify(results[test.key], null, 2)
            }}</pre>
          </div>

          <!-- Not tested state -->
          <div
            v-if="!results[test.key] && !errors[test.key]"
            class="rounded-md border border-gray-200 bg-gray-50 p-3"
          >
            <p class="text-sm text-gray-600">
              Click "Test" to run this API call
            </p>
          </div>
        </div>
      </div>

      <!-- Connection Info -->
      <div class="bg-muted/50 rounded-lg border p-4">
        <h3 class="mb-2 text-lg font-semibold">Connection Info</h3>
        <div class="text-muted-foreground space-y-1 text-sm">
          <p>
            <strong>Supabase URL:</strong>
            {{ $env.VITE_SUPABASE_URL || 'Not configured' }}
          </p>
          <p>
            <strong>Environment:</strong>
            {{ $env.VITE_APP_ENV || 'development' }}
          </p>
        </div>
      </div>
    </div>
  </Page>
</template>
