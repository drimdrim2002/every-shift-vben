<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationRegister, z } from '@vben/common-ui';

import { useSupabaseAuthStore } from '#/store/supabase-auth';

defineOptions({ name: 'Signup' });

const authStore = useSupabaseAuthStore();
const router = useRouter();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'Enter your full name',
      },
      fieldName: 'full_name',
      label: 'Full Name',
      rules: z
        .string()
        .min(2, { message: 'Full name must be at least 2 characters' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'Enter your username',
      },
      fieldName: 'username',
      label: 'Username',
      rules: z
        .string()
        .min(3, { message: 'Username must be at least 3 characters' })
        .regex(/^[\w-]+$/, {
          message:
            'Username can only contain letters, numbers, underscore and dash',
        }),
    },
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
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: 'Confirm your password',
      },
      fieldName: 'confirmPassword',
      label: 'Confirm Password',
      rules: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' }),
    },
  ];
});

// Handle form submission
async function handleSubmit(values: any) {
  // Check if passwords match
  if (values.password !== values.confirmPassword) {
    throw new Error('Passwords do not match');
  }

  await authStore.authSignup({
    email: values.email,
    password: values.password,
    full_name: values.full_name,
    username: values.username,
  });

  // Redirect to login page after successful signup
  router.push('/login');
}
</script>

<template>
  <AuthenticationRegister
    :form-schema="formSchema"
    :loading="authStore.signupLoading"
    @submit="handleSubmit"
  >
    <template #form-footer>
      <div class="flex flex-col gap-3 text-center text-sm">
        <div>
          <span class="text-muted-foreground">Already have an account? </span>
          <a href="/login" class="text-primary hover:underline"> Sign in </a>
        </div>
        <div class="text-muted-foreground mt-4 border-t pt-4 text-xs">
          <p>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </template>
  </AuthenticationRegister>
</template>
