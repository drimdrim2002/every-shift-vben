import type { UserInfo } from '@vben/types';

import type { AuthUser } from '#/types/database';

import { authUtils, getCompleteUserData } from '#/lib/supabase-utils';

export namespace SupabaseAuthApi {
  /** Login interface parameters */
  export interface LoginParams {
    email: string;
    password: string;
  }

  /** Signup interface parameters */
  export interface SignupParams {
    email: string;
    password: string;
    full_name?: string;
    username?: string;
  }

  /** Login interface return value */
  export interface LoginResult {
    accessToken: string;
    user: AuthUser;
  }

  /** Password reset parameters */
  export interface ResetPasswordParams {
    email: string;
  }

  /** Update password parameters */
  export interface UpdatePasswordParams {
    password: string;
  }
}

/**
 * Login with Supabase
 */
export async function supabaseLoginApi(
  data: SupabaseAuthApi.LoginParams,
): Promise<SupabaseAuthApi.LoginResult> {
  const { email, password } = data;

  // Sign in with Supabase
  const { data: authData, error: authError } = await authUtils.signIn(
    email,
    password,
  );

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Login failed');
  }

  // Get complete user data including profile, roles, permissions
  const { user: completeUser, error: userError } = await getCompleteUserData(
    authData.user.id,
  );

  if (userError || !completeUser) {
    throw new Error(userError?.message || 'Failed to get user information');
  }

  // Return access token and user data
  return {
    accessToken: authData.session?.access_token || '',
    user: completeUser,
  };
}

/**
 * Sign up with Supabase
 */
export async function supabaseSignupApi(data: SupabaseAuthApi.SignupParams) {
  const { email, password, full_name, username } = data;

  const { data: authData, error } = await authUtils.signUp(email, password, {
    full_name,
    username,
  });

  if (error) {
    throw new Error(error.message);
  }

  return authData;
}

/**
 * Logout with Supabase
 */
export async function supabaseLogoutApi() {
  const { error } = await authUtils.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Get user info from Supabase
 */
export async function supabaseGetUserInfoApi(): Promise<UserInfo> {
  // Get current user from Supabase
  const {
    data: { user },
    error: authError,
  } = await authUtils.getCurrentUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Get complete user data
  const { user: completeUser, error: userError } = await getCompleteUserData(
    user.id,
  );

  if (userError || !completeUser) {
    throw new Error('Failed to get user information');
  }

  // Convert to Vben UserInfo format
  const userInfo: UserInfo = {
    userId: completeUser.id,
    username: completeUser.profile?.username || completeUser.email,
    realName: completeUser.profile?.full_name || completeUser.email,
    avatar: completeUser.profile?.avatar_url || '',
    roles: completeUser.roles.map((role) => role.role),
    homePath: '/dashboard',
    // Additional user information
    email: completeUser.email,
    phone: completeUser.profile?.phone || '',
    company: completeUser.profile?.company || '',
    jobTitle: completeUser.profile?.job_title || '',
    department: completeUser.profile?.department || '',
  };

  return userInfo;
}

/**
 * Get user access codes/permissions
 */
export async function supabaseGetAccessCodesApi(): Promise<string[]> {
  // Get current user from Supabase
  const {
    data: { user },
    error: authError,
  } = await authUtils.getCurrentUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Get complete user data with permissions
  const { user: completeUser, error: userError } = await getCompleteUserData(
    user.id,
  );

  if (userError || !completeUser) {
    return [];
  }

  return completeUser.permissions;
}

/**
 * Reset password
 */
export async function supabaseResetPasswordApi(
  data: SupabaseAuthApi.ResetPasswordParams,
) {
  const { email } = data;

  const { data: result, error } = await authUtils.resetPassword(email);

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

/**
 * Update password
 */
export async function supabaseUpdatePasswordApi(
  data: SupabaseAuthApi.UpdatePasswordParams,
) {
  const { password } = data;

  const { data: result, error } = await authUtils.updatePassword(password);

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

/**
 * Refresh access token
 */
export async function supabaseRefreshTokenApi() {
  // Supabase handles token refresh automatically
  // Just check if user is still authenticated
  const {
    data: { user },
    error,
  } = await authUtils.getCurrentUser();

  if (error || !user) {
    throw new Error('Token refresh failed');
  }

  return {
    data: user.aud, // audience
    status: 200,
  };
}
