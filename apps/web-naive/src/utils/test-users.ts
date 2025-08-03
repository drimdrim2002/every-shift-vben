import { supabase } from '#/lib/supabase';

/**
 * Test users for permission system testing
 */
export const TEST_USERS = {
  ADMIN: {
    email: 'admin@test.com',
    password: 'admin123456',
    full_name: 'System Administrator',
    username: 'admin',
    role: 'admin',
    description: 'Full system access with all administrative privileges',
  },
  MANAGER: {
    email: 'manager@test.com',
    password: 'manager123456',
    full_name: 'Department Manager',
    username: 'manager',
    role: 'manager',
    description:
      'Management access with user and content management capabilities',
  },
  EMPLOYEE: {
    email: 'employee@test.com',
    password: 'employee123456',
    full_name: 'Regular Employee',
    username: 'employee',
    role: 'employee',
    description:
      'Standard user access with basic dashboard and profile management',
  },
};

/**
 * Create test users in Supabase
 * Note: This should be run with service role key in a secure environment
 */
export async function createTestUsers() {
  const results = [];

  for (const [userType, userData] of Object.entries(TEST_USERS)) {
    try {
      console.warn(`Creating ${userType} user...`);

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
            username: userData.username,
          },
        });

      if (authError) {
        console.error(`Failed to create auth user for ${userType}:`, authError);
        results.push({ userType, success: false, error: authError.message });
        continue;
      }

      if (!authData.user) {
        console.error(`No user data returned for ${userType}`);
        results.push({
          userType,
          success: false,
          error: 'No user data returned',
        });
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: userData.username,
        full_name: userData.full_name,
        email: userData.email,
        is_active: true,
      });

      if (profileError) {
        console.error(
          `Failed to create profile for ${userType}:`,
          profileError,
        );
        results.push({
          userType,
          success: false,
          error: profileError.message,
        });
        continue;
      }

      // Assign role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: userData.role,
      });

      if (roleError) {
        console.error(`Failed to assign role for ${userType}:`, roleError);
        results.push({ userType, success: false, error: roleError.message });
        continue;
      }

      console.warn(`✅ Successfully created ${userType} user`);
      results.push({
        userType,
        success: true,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
    } catch (error) {
      console.error(`Unexpected error creating ${userType}:`, error);
      results.push({
        userType,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Reset test users (delete and recreate)
 */
export async function resetTestUsers() {
  console.warn('Resetting test users...');

  // Delete existing test users
  for (const userData of Object.values(TEST_USERS)) {
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(
        (user) => user.email === userData.email,
      );

      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.warn(`Deleted existing user: ${userData.email}`);
      }
    } catch (error) {
      console.warn(`Failed to delete user ${userData.email}:`, error);
    }
  }

  // Wait a bit for deletion to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Create fresh test users
  return createTestUsers();
}

/**
 * Get current user permissions for debugging
 */
export async function getCurrentUserInfo() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No authenticated user' };
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    // Get permissions
    const { data: permissions } = await supabase.from('role_permissions')
      .select(`
        role,
        permissions (
          name,
          description,
          resource,
          action
        )
      `);

    const userRoles = roles?.map((r) => r.role) || [];
    const userPermissions =
      permissions
        ?.filter((rp) => userRoles.includes(rp.role))
        .map((rp) => (rp.permissions as any)?.name)
        .filter(Boolean) || [];

    return {
      user: {
        id: user.id,
        email: user.email,
        profile,
        roles: userRoles,
        permissions: userPermissions,
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test permission functions
 */
export function logTestInstructions() {
  console.warn('🧪 PERMISSION SYSTEM TEST INSTRUCTIONS');
  console.warn('=====================================');
  console.warn();
  console.warn('1. Test Users Available:');
  Object.entries(TEST_USERS).forEach(([type, user]) => {
    console.warn(`   ${type}:`);
    console.warn(`     Email: ${user.email}`);
    console.warn(`     Password: ${user.password}`);
    console.warn(`     Role: ${user.role}`);
    console.warn(`     Description: ${user.description}`);
    console.warn();
  });

  console.warn('2. Test Scenarios:');
  console.warn('   a) Login as ADMIN → Should see all menus and features');
  console.warn(
    '   b) Login as MANAGER → Should see user management but not permission management',
  );
  console.warn(
    '   c) Login as EMPLOYEE → Should only see dashboard and profile',
  );
  console.warn();

  console.warn('3. What to Test:');
  console.warn('   - Menu visibility based on role');
  console.warn(
    '   - Route access (try accessing /system/permission as non-admin)',
  );
  console.warn('   - Button visibility in user management');
  console.warn('   - 403 page when accessing forbidden routes');
  console.warn();

  console.warn('4. Console Commands for Testing:');
  console.warn('   - createTestUsers() - Create all test users');
  console.warn('   - resetTestUsers() - Delete and recreate test users');
  console.warn('   - getCurrentUserInfo() - Debug current user permissions');
}
