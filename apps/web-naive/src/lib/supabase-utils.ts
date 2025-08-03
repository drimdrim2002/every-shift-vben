import type { AuthUser, Profile, UserRole } from '#/types/database';

import { supabase } from './supabase';

/**
 * Authentication utilities
 */
export const authUtils = {
  /**
   * Sign up a new user
   */
  async signUp(
    email: string,
    password: string,
    userData?: { full_name?: string; username?: string },
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  /**
   * Update password
   */
  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  },
};

/**
 * Profile utilities
 */
export const profileUtils = {
  /**
   * Get user profile by ID
   */
  async getProfile(
    userId: string,
  ): Promise<{ error: any; profile: null | Profile }> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { profile, error };
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Create user profile
   */
  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...profile,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    return { data, error };
  },
};

/**
 * Role and permission utilities
 */
export const roleUtils = {
  /**
   * Get user roles
   */
  async getUserRoles(
    userId: string,
  ): Promise<{ error: any; roles: UserRole[] }> {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    return { roles: roles || [], error };
  },

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Remove role from user
   */
  async removeRole(userId: string, role: string) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    return { error };
  },

  /**
   * Get user permissions based on roles
   */
  async getUserPermissions(
    userId: string,
  ): Promise<{ error: any; permissions: string[] }> {
    // First get user roles
    const { roles, error: rolesError } = await this.getUserRoles(userId);

    if (rolesError || roles.length === 0) {
      return { permissions: [], error: rolesError };
    }

    // Then get permissions for those roles
    const roleNames = roles.map((r) => r.role);
    const { data: rolePermissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select(
        `
        permission_id,
        permissions (
          name
        )
      `,
      )
      .in('role', roleNames);

    if (permissionsError) {
      return { permissions: [], error: permissionsError };
    }

    // Extract permission names
    const permissions =
      rolePermissions
        ?.map((rp) => (rp.permissions as any)?.name)
        .filter(Boolean) || [];

    return { permissions, error: null };
  },
};

/**
 * Get complete user data with profile, roles, and permissions
 */
export async function getCompleteUserData(
  userId: string,
): Promise<{ error: any; user: AuthUser | null }> {
  try {
    // Get user profile
    const { profile, error: profileError } =
      await profileUtils.getProfile(userId);

    if (profileError && profileError.code !== 'PGRST116') {
      // Ignore "not found" errors
      return { user: null, error: profileError };
    }

    // Get user roles
    const { roles, error: rolesError } = await roleUtils.getUserRoles(userId);

    if (rolesError) {
      console.warn('Failed to get user roles:', rolesError);
    }

    // Get user permissions
    const { permissions, error: permissionsError } =
      await roleUtils.getUserPermissions(userId);

    if (permissionsError) {
      console.warn('Failed to get user permissions:', permissionsError);
    }

    // Get basic user info
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { user: null, error: authError };
    }

    const completeUser: AuthUser = {
      id: userId,
      email: authUser.email || '',
      profile: profile || undefined,
      roles: roles || [],
      permissions: permissions || [],
    };

    return { user: completeUser, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Real-time subscriptions utilities
 */
export const realtimeUtils = {
  /**
   * Subscribe to profile changes
   */
  subscribeToProfile(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  },

  /**
   * Subscribe to user roles changes
   */
  subscribeToUserRoles(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_roles:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();
  },
};
