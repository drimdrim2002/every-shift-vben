<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';

import { useSupabaseAuthStore } from '#/store/supabase-auth';

defineOptions({ name: 'SupabaseLogin' });

const authStore = useSupabaseAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'Enter your email address',
        type: 'email',
      },
      fieldName: 'email',
      label: 'Email',
      rules: z
        .string()
        .email({ message: 'Please enter a valid email address' })
        .min(1, { message: 'Email is required' }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: 'Enter your password',
      },
      fieldName: 'password',
      label: 'Password',
      rules: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' }),
    },
  ];
});

// Handle form submission
async function handleSubmit(values: any) {
  await authStore.authLogin({
    email: values.email,
    password: values.password,
  });
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleSubmit"
  >
    <template #form-footer>
      <div class="flex flex-col gap-3 text-center text-sm">
        <div>
          <span class="text-muted-foreground">Don't have an account? </span>
          <a href="/signup" class="text-primary hover:underline"> Sign up </a>
        </div>
        <div>
          <a
            href="/forgot-password"
            class="text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot your password?
          </a>
        </div>
        <div class="text-muted-foreground mt-4 border-t pt-4 text-xs">
          <p>Test Accounts:</p>
          <p><strong>Admin:</strong> admin@example.com / 123456</p>
          <p><strong>Manager:</strong> manager@example.com / 123456</p>
          <p><strong>Employee:</strong> employee@example.com / 123456</p>
        </div>
      </div>
    </template>
  </AuthenticationLogin>
</template>
