# Supabase Database Setup Instructions

Follow these steps to set up your database schema in Supabase:

## 1. Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/projects
2. Select your project: `atuqzcyzuecixshusbib`
3. Navigate to **SQL Editor** in the left sidebar

## 2. Run Migration Files

Execute the following SQL files in order:

### Step 1: Create Profiles Table

Copy and paste the contents of `migrations/01_create_profiles_table.sql` into the SQL Editor and run it.

This will create:

- `profiles` table with user profile information
- Row Level Security (RLS) policies
- Auto-trigger to create profile when user signs up
- Updated timestamp triggers

### Step 2: Create Roles and Permissions

Copy and paste the contents of `migrations/02_create_roles_and_permissions.sql` into the SQL Editor and run it.

This will create:

- `permissions` table with system permissions
- `user_roles` table for user role assignments
- `role_permissions` table for role-permission mappings
- Default permissions and role configurations
- RLS policies for security

### Step 3: Create Helper Functions

Copy and paste the contents of `migrations/03_create_helper_functions.sql` into the SQL Editor and run it.

This will create:

- Helper functions for permission checking
- Role management functions
- Default role assignment triggers
- Role hierarchy functions

### Step 4: Handle Existing Users

Copy and paste the contents of `migrations/04_handle_existing_users.sql` into the SQL Editor and run it.

This will:

- Create profiles for any existing users
- Assign default 'employee' role to existing users
- Optionally make a specific user admin (uncomment and update email)

### Step 5: Create Test Users (Optional)

After setting up the database, you can create test users by:

1. First, sign up these users through your application:
   - admin@example.com / 123456
   - manager@example.com / 123456
   - employee@example.com / 123456

2. Then run `migrations/05_create_test_users.sql` to assign proper roles to these test accounts.

## 3. Verify Setup

After running all migrations, you should see these tables in your Database section:

### Tables Created:

- `profiles` - User profile information
- `permissions` - System permissions
- `user_roles` - User role assignments
- `role_permissions` - Role-permission mappings

### Default Roles:

- **admin** - Full system access
- **manager** - User and content management
- **employee** - Basic dashboard and profile access

### Default Permissions:

- User management (create, read, update, delete)
- Profile management (read, update)
- Role management (read, manage)
- Dashboard access
- Analytics access
- Settings management
- Reports management

## 4. Test the Setup

You can test the setup by:

1. Creating a test user through authentication
2. Checking if a profile was automatically created
3. Verifying the default 'employee' role was assigned
4. Testing permission functions in SQL Editor

## 5. First Admin User

To create your first admin user, you have two options:

### Option A: Using the migration script

In `04_handle_existing_users.sql`, uncomment the bottom section and update the email to your email address, then run the script.

### Option B: Manual SQL

1. Sign up through your application or Supabase Auth
2. Run this SQL with your email:

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## 6. Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data unless they have appropriate permissions
- Admin functions are protected and require admin role
- All sensitive operations are logged and auditable

## Next Steps

After setting up the database:

1. Test the connection using the test file in your project
2. Integrate authentication with your Vue application
3. Implement role-based access control in your frontend
4. Set up real-time subscriptions for live updates
