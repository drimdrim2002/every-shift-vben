-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL, -- e.g., 'users', 'reports', 'settings'
  action TEXT NOT NULL,    -- e.g., 'create', 'read', 'update', 'delete'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- e.g., 'admin', 'manager', 'employee', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create role_permissions table (junction table)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Set up Row Level Security
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions policies
DROP POLICY IF EXISTS "Permissions are viewable by authenticated users." ON public.permissions;
CREATE POLICY "Permissions are viewable by authenticated users." ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles." ON public.user_roles;
CREATE POLICY "Users can view their own roles." ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can manage user roles." ON public.user_roles;
CREATE POLICY "Only admins can manage user roles." ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Role permissions policies
DROP POLICY IF EXISTS "Role permissions are viewable by authenticated users." ON public.role_permissions;
CREATE POLICY "Role permissions are viewable by authenticated users." ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only admins can manage role permissions." ON public.role_permissions;
CREATE POLICY "Only admins can manage role permissions." ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Insert default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  -- User management
  ('users.create', 'Create new users', 'users', 'create'),
  ('users.read', 'View user information', 'users', 'read'),
  ('users.update', 'Update user information', 'users', 'update'),
  ('users.delete', 'Delete users', 'users', 'delete'),
  
  -- Profile management
  ('profiles.read', 'View user profiles', 'profiles', 'read'),
  ('profiles.update', 'Update user profiles', 'profiles', 'update'),
  
  -- Role management
  ('roles.read', 'View roles and permissions', 'roles', 'read'),
  ('roles.manage', 'Manage user roles', 'roles', 'manage'),
  
  -- Dashboard access
  ('dashboard.read', 'Access dashboard', 'dashboard', 'read'),
  ('analytics.read', 'View analytics', 'analytics', 'read'),
  
  -- Settings
  ('settings.read', 'View system settings', 'settings', 'read'),
  ('settings.update', 'Update system settings', 'settings', 'update'),
  
  -- Reports
  ('reports.read', 'View reports', 'reports', 'read'),
  ('reports.create', 'Create reports', 'reports', 'create'),
  ('reports.export', 'Export reports', 'reports', 'export')
ON CONFLICT (name) DO NOTHING;

-- Insert default role permissions
WITH role_permission_mappings AS (
  SELECT 'admin' as role_name, p.id as permission_id
  FROM public.permissions p
  
  UNION ALL
  
  SELECT 'manager' as role_name, p.id as permission_id
  FROM public.permissions p
  WHERE p.name IN (
    'users.read', 'users.update',
    'profiles.read', 'profiles.update',
    'roles.read',
    'dashboard.read', 'analytics.read',
    'settings.read',
    'reports.read', 'reports.create', 'reports.export'
  )
  
  UNION ALL
  
  SELECT 'employee' as role_name, p.id as permission_id
  FROM public.permissions p
  WHERE p.name IN (
    'profiles.read', 'profiles.update',
    'dashboard.read',
    'reports.read'
  )
  
)
INSERT INTO public.role_permissions (role, permission_id)
SELECT role_name, permission_id FROM role_permission_mappings
ON CONFLICT (role, permission_id) DO NOTHING;