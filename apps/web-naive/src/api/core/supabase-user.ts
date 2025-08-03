import type { UserInfo } from '@vben/types';

import type { AuthUser, Profile } from '#/types/database';

import { supabase } from '#/lib/supabase';
import { authUtils, getCompleteUserData } from '#/lib/supabase-utils';

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'all' | 'inactive';
}

export interface UserListResult {
  users: AuthUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  username?: string;
  role: string;
  phone?: string;
  company?: string;
  job_title?: string;
  department?: string;
}

export interface UpdateUserParams {
  full_name?: string;
  username?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  department?: string;
  avatar_url?: string;
  is_active?: boolean;
}

/**
 * Get current user info (use supabaseGetUserInfoApi from supabase-auth.ts instead)
 * This function is kept for backward compatibility but delegates to the auth module
 */
export async function getCurrentUserInfoApi(): Promise<UserInfo> {
  const { data: userData, error } = await authUtils.getCurrentUser();

  if (error || !userData.user) {
    throw new Error('User not authenticated');
  }

  const { user: completeUser, error: userError } = await getCompleteUserData(
    userData.user.id,
  );

  if (userError || !completeUser) {
    throw new Error('Failed to get user information');
  }

  return {
    userId: completeUser.id,
    username: completeUser.profile?.username || completeUser.email,
    realName: completeUser.profile?.full_name || completeUser.email,
    avatar: completeUser.profile?.avatar_url || '',
    roles: completeUser.roles.map((role) => role.role),
    homePath: '/dashboard',
    email: completeUser.email,
    phone: completeUser.profile?.phone || '',
    company: completeUser.profile?.company || '',
    jobTitle: completeUser.profile?.job_title || '',
    department: completeUser.profile?.department || '',
  };
}

/**
 * Get list of all users (admin only)
 */
export async function getUserListApi(
  params: UserListParams = {},
): Promise<UserListResult> {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    role = '',
    status = 'all',
  } = params;

  // Build query
  let query = supabase.from('profiles').select(
    `
      *,
      user_roles (
        role,
        created_at
      )
    `,
    { count: 'exact' },
  );

  // Apply search filter
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  // Apply status filter
  if (status !== 'all') {
    query = query.eq('is_active', status === 'active');
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  // Execute query
  const { data: profiles, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  // Transform data to AuthUser format
  const users: AuthUser[] = (profiles || []).map((profile) => ({
    id: profile.id,
    email: profile.email || '',
    profile: profile as Profile,
    roles:
      (profile.user_roles as any[])?.map((ur) => ({ role: ur.role })) || [],
    permissions: [], // Would need to fetch separately if needed
  }));

  // Filter by role if specified
  const filteredUsers = role
    ? users.filter((user) => user.roles.some((r) => r.role === role))
    : users;

  return {
    users: filteredUsers,
    total: count || 0,
    page,
    pageSize,
  };
}

/**
 * Create a new user (admin only)
 */
export async function createUserApi(params: CreateUserParams) {
  // First create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.full_name,
        username: params.username,
      },
    });

  if (authError || !authData.user) {
    throw new Error(`Failed to create user: ${authError?.message}`);
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    username: params.username,
    full_name: params.full_name,
    phone: params.phone,
    company: params.company,
    job_title: params.job_title,
    department: params.department,
    email: params.email,
  });

  if (profileError) {
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  // Assign role
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: authData.user.id,
    role: params.role,
  });

  if (roleError) {
    throw new Error(`Failed to assign role: ${roleError.message}`);
  }

  return { success: true, user: authData.user };
}

/**
 * Update user information
 */
export async function updateUserApi(userId: string, params: UpdateUserParams) {
  // Update profile
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return { success: true, user: data };
}

/**
 * Update user role (admin only)
 */
export async function updateUserRoleApi(userId: string, newRole: string) {
  // Remove existing roles
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to remove old roles: ${deleteError.message}`);
  }

  // Add new role
  const { error: insertError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: newRole,
  });

  if (insertError) {
    throw new Error(`Failed to assign new role: ${insertError.message}`);
  }

  return { success: true };
}

/**
 * Delete user (admin only)
 */
export async function deleteUserApi(userId: string) {
  // Delete user from auth (this will cascade to profiles and user_roles)
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  return { success: true };
}

/**
 * Toggle user active status (admin only)
 */
export async function toggleUserStatusApi(userId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user status: ${error.message}`);
  }

  return { success: true, user: data };
}

/**
 * Get user's detailed information including roles and permissions
 */
export async function getUserDetailApi(userId: string): Promise<AuthUser> {
  const { user, error } = await getCompleteUserData(userId);

  if (error || !user) {
    throw new Error('Failed to get user details');
  }

  return user;
}

/**
 * Update current user's profile
 */
export async function updateCurrentUserProfileApi(params: UpdateUserParams) {
  const { data: userData, error: userError } = await authUtils.getCurrentUser();

  if (userError || !userData.user) {
    throw new Error('User not authenticated');
  }

  return updateUserApi(userData.user.id, params);
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatarApi(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrl = urlData.publicUrl;

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(
      `Failed to update profile with avatar: ${updateError.message}`,
    );
  }

  return { success: true, avatarUrl };
}
