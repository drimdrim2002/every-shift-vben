import { supabase } from '#/lib/supabase';

export interface RoleInfo {
  role: string;
  description?: string;
  permissions: string[];
  userCount: number;
}

export interface PermissionInfo {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  roles: string[];
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalPermissions: number;
}

/**
 * Get all available roles with their permissions and user counts
 */
export async function getRolesApi(): Promise<RoleInfo[]> {
  // Get all role-permission mappings
  const { data: rolePermissions, error: rpError } = await supabase.from(
    'role_permissions',
  ).select(`
      role,
      permissions (
        name,
        description,
        resource,
        action
      )
    `);

  if (rpError) {
    throw new Error(`Failed to fetch role permissions: ${rpError.message}`);
  }

  // Get user counts per role
  const { data: userRoles, error: urError } = await supabase
    .from('user_roles')
    .select('role, user_id');

  if (urError) {
    throw new Error(`Failed to fetch user roles: ${urError.message}`);
  }

  // Group data by role
  const roleMap = new Map<string, RoleInfo>();

  // Initialize with basic roles
  const basicRoles = ['admin', 'manager', 'employee'];
  basicRoles.forEach((role) => {
    roleMap.set(role, {
      role,
      description: getDefaultRoleDescription(role),
      permissions: [],
      userCount: 0,
    });
  });

  // Add permissions to roles
  rolePermissions?.forEach((rp) => {
    const role = roleMap.get(rp.role);
    if (role && rp.permissions) {
      role.permissions.push((rp.permissions as any).name);
    }
  });

  // Count users per role
  const userCounts = userRoles?.reduce(
    (acc, ur) => {
      acc[ur.role] = (acc[ur.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Update user counts
  roleMap.forEach((role) => {
    role.userCount = userCounts?.[role.role] || 0;
  });

  return [...roleMap.values()];
}

/**
 * Get all available permissions
 */
export async function getPermissionsApi(): Promise<PermissionInfo[]> {
  const { data: permissions, error: pError } = await supabase
    .from('permissions')
    .select('*');

  if (pError) {
    throw new Error(`Failed to fetch permissions: ${pError.message}`);
  }

  // Get roles for each permission
  const { data: rolePermissions, error: rpError } = await supabase
    .from('role_permissions')
    .select('role, permission_id');

  if (rpError) {
    throw new Error(`Failed to fetch role permissions: ${rpError.message}`);
  }

  // Group roles by permission
  const permissionRoles = rolePermissions?.reduce(
    (acc, rp) => {
      if (!acc[rp.permission_id]) {
        acc[rp.permission_id] = [];
      }
      acc[rp.permission_id].push(rp.role);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    permissions?.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      resource: p.resource,
      action: p.action,
      roles: permissionRoles?.[p.id] || [],
    })) || []
  );
}

/**
 * Create a new role (admin only)
 */
export async function createRoleApi(role: string, description?: string) {
  // For this implementation, roles are managed through the role_permissions table
  // We just need to ensure the role exists in our system
  return { success: true, role, description };
}

/**
 * Update role permissions (admin only)
 */
export async function updateRolePermissionsApi(
  role: string,
  permissionIds: string[],
) {
  // Remove existing permissions for this role
  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role', role);

  if (deleteError) {
    throw new Error(`Failed to remove old permissions: ${deleteError.message}`);
  }

  // Add new permissions
  if (permissionIds.length > 0) {
    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(
        permissionIds.map((permissionId) => ({
          role,
          permission_id: permissionId,
        })),
      );

    if (insertError) {
      throw new Error(`Failed to assign permissions: ${insertError.message}`);
    }
  }

  return { success: true };
}

/**
 * Create a new permission (admin only)
 */
export async function createPermissionApi(params: {
  action: string;
  description?: string;
  name: string;
  resource: string;
}) {
  const { data, error } = await supabase
    .from('permissions')
    .insert(params)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create permission: ${error.message}`);
  }

  return { success: true, permission: data };
}

/**
 * Update permission (admin only)
 */
export async function updatePermissionApi(
  id: string,
  params: {
    action?: string;
    description?: string;
    name?: string;
    resource?: string;
  },
) {
  const { data, error } = await supabase
    .from('permissions')
    .update(params)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update permission: ${error.message}`);
  }

  return { success: true, permission: data };
}

/**
 * Delete permission (admin only)
 */
export async function deletePermissionApi(id: string) {
  const { error } = await supabase.from('permissions').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete permission: ${error.message}`);
  }

  return { success: true };
}

/**
 * Get system statistics
 */
export async function getSystemStatsApi(): Promise<SystemStats> {
  // Get total users
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (usersError) {
    throw new Error(`Failed to get user count: ${usersError.message}`);
  }

  // Get active users
  const { count: activeUsers, error: activeError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (activeError) {
    throw new Error(`Failed to get active user count: ${activeError.message}`);
  }

  // Get total permissions
  const { count: totalPermissions, error: permissionsError } = await supabase
    .from('permissions')
    .select('*', { count: 'exact', head: true });

  if (permissionsError) {
    throw new Error(
      `Failed to get permissions count: ${permissionsError.message}`,
    );
  }

  // Get unique roles
  const { data: roles, error: rolesError } = await supabase
    .from('role_permissions')
    .select('role');

  if (rolesError) {
    throw new Error(`Failed to get roles: ${rolesError.message}`);
  }

  const uniqueRoles = new Set(roles?.map((r) => r.role) || []);

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    totalRoles: uniqueRoles.size + 1, // +1 for employee role that might not have permissions
    totalPermissions: totalPermissions || 0,
  };
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogsApi(params: {
  action?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  userId?: string;
}) {
  // This would require an audit_logs table
  // For now, return empty results
  return {
    logs: [],
    total: 0,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
  };
}

/**
 * Get user activity (admin only)
 */
export async function getUserActivityApi(userId: string, _days: number = 30) {
  // This would require user activity tracking
  // For now, return empty results
  return {
    activities: [],
    summary: {
      loginCount: 0,
      lastLogin: null,
      avgSessionTime: 0,
    },
  };
}

/**
 * Helper function to get default role descriptions
 */
function getDefaultRoleDescription(role: string): string {
  switch (role) {
    case 'admin': {
      return 'Full system access with all administrative privileges';
    }
    case 'employee': {
      return 'Standard user access with basic dashboard and profile management';
    }
    case 'manager': {
      return 'Management access with user and content management capabilities';
    }
    default: {
      return `Custom role: ${role}`;
    }
  }
}

/**
 * Bulk update user roles (admin only)
 */
export async function bulkUpdateUserRolesApi(
  updates: Array<{ role: string; userId: string }>,
) {
  const results = [];

  for (const update of updates) {
    try {
      // Remove existing role
      await supabase.from('user_roles').delete().eq('user_id', update.userId);

      // Add new role
      await supabase.from('user_roles').insert({
        user_id: update.userId,
        role: update.role,
      });

      results.push({ userId: update.userId, success: true });
    } catch (error) {
      results.push({
        userId: update.userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { results };
}
