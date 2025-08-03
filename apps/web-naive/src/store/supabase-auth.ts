import type { UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { notification } from '#/adapter/naive';
import {
  supabaseGetAccessCodesApi,
  supabaseGetUserInfoApi,
  supabaseLoginApi,
  supabaseLogoutApi,
  supabaseResetPasswordApi,
  supabaseSignupApi,
} from '#/api/core/supabase-auth';
import { supabase } from '#/lib/supabase';
import { realtimeUtils } from '#/lib/supabase-utils';
import { $t } from '#/locales';

export const useSupabaseAuthStore = defineStore('supabase-auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const signupLoading = ref(false);
  const authSubscription = ref<any>(null);

  /**
   * Initialize authentication state listener
   */
  function initAuthListener() {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.warn('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in - update stores
        await handleUserSignedIn(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear stores
        resetAllStores();
      } else if (
        event === 'TOKEN_REFRESHED' && // Token refreshed - update access token
        session?.access_token
      ) {
        accessStore.setAccessToken(session.access_token);
      }
    });

    authSubscription.value = subscription;
  }

  /**
   * Handle user signed in event
   */
  async function handleUserSignedIn(userId: string) {
    try {
      const [userInfo, accessCodes] = await Promise.all([
        supabaseGetUserInfoApi(),
        supabaseGetAccessCodesApi(),
      ]);

      userStore.setUserInfo(userInfo);
      accessStore.setAccessCodes(accessCodes);

      // Set up real-time subscriptions for user data
      setupRealtimeSubscriptions(userId);
    } catch (error) {
      console.error('Failed to handle user signed in:', error);
    }
  }

  /**
   * Set up real-time subscriptions for user data changes
   */
  function setupRealtimeSubscriptions(userId: string) {
    // Subscribe to profile changes
    realtimeUtils.subscribeToProfile(userId, async (payload) => {
      console.warn('Profile changed:', payload);
      // Refresh user info when profile changes
      try {
        const userInfo = await supabaseGetUserInfoApi();
        userStore.setUserInfo(userInfo);
      } catch (error) {
        console.error('Failed to refresh user info:', error);
      }
    });

    // Subscribe to role changes
    realtimeUtils.subscribeToUserRoles(userId, async (payload) => {
      console.warn('User roles changed:', payload);
      // Refresh user info and access codes when roles change
      try {
        const [userInfo, accessCodes] = await Promise.all([
          supabaseGetUserInfoApi(),
          supabaseGetAccessCodesApi(),
        ]);
        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    });
  }

  /**
   * Login with email and password
   */
  async function authLogin(
    params: { email: string; password: string },
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      const { accessToken, user } = await supabaseLoginApi(params);

      if (accessToken && user) {
        // Store access token
        accessStore.setAccessToken(accessToken);

        // Get user info and access codes
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          supabaseGetUserInfoApi(),
          supabaseGetAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        // Set up real-time subscriptions
        setupRealtimeSubscriptions(user.id);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            content: $t('authentication.loginSuccess'),
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3000,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        content: $t('authentication.loginFailed'),
        description: error.message || 'Login failed',
        duration: 5000,
      });
      throw error;
    } finally {
      loginLoading.value = false;
    }

    return { userInfo };
  }

  /**
   * Sign up new user
   */
  async function authSignup(params: {
    email: string;
    full_name?: string;
    password: string;
    username?: string;
  }) {
    try {
      signupLoading.value = true;

      const result = await supabaseSignupApi(params);

      if (result.user) {
        notification.success({
          content: 'Registration Successful',
          description: 'Please check your email to verify your account.',
          duration: 5000,
        });
      }

      return result;
    } catch (error: any) {
      notification.error({
        content: 'Registration Failed',
        description: error.message || 'Registration failed',
        duration: 5000,
      });
      throw error;
    } finally {
      signupLoading.value = false;
    }
  }

  /**
   * Reset password
   */
  async function resetPassword(email: string) {
    try {
      await supabaseResetPasswordApi({ email });

      notification.success({
        content: 'Password Reset Email Sent',
        description: 'Check your email for password reset instructions.',
        duration: 5000,
      });
    } catch (error: any) {
      notification.error({
        content: 'Password Reset Failed',
        description: error.message || 'Failed to send reset email',
        duration: 5000,
      });
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async function logout(redirect: boolean = true) {
    try {
      await supabaseLogoutApi();
    } catch (error) {
      console.warn('Logout API error:', error);
    }

    // Clean up subscriptions
    if (authSubscription.value) {
      authSubscription.value.unsubscribe();
      authSubscription.value = null;
    }

    resetAllStores();
    accessStore.setLoginExpired(false);

    if (redirect) {
      await router.replace({
        path: LOGIN_PATH,
        query: {
          redirect: encodeURIComponent(router.currentRoute.value.fullPath),
        },
      });
    }
  }

  /**
   * Fetch current user info
   */
  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    try {
      userInfo = await supabaseGetUserInfoApi();
      userStore.setUserInfo(userInfo);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
    return userInfo;
  }

  /**
   * Check if user is authenticated
   */
  async function checkAuth(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Initialize store
   */
  async function initialize() {
    initAuthListener();

    // Check if user is already authenticated
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await handleUserSignedIn(user.id);
        }
      } catch (error) {
        console.error('Failed to initialize authenticated user:', error);
      }
    }
  }

  function $reset() {
    loginLoading.value = false;
    signupLoading.value = false;
    if (authSubscription.value) {
      authSubscription.value.unsubscribe();
      authSubscription.value = null;
    }
  }

  return {
    $reset,
    authLogin,
    authSignup,
    resetPassword,
    fetchUserInfo,
    loginLoading,
    signupLoading,
    logout,
    checkAuth,
    initialize,
  };
});
