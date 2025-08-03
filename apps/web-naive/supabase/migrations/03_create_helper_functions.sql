-- Create helper functions for role and permission management

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_has_permission.user_id
      AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = user_has_role.user_id
      AND ur.role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = get_user_permissions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id UUID)
RETURNS TABLE(role_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = get_user_roles.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign default role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign 'employee' role as default for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign default role when profile is created
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Function to safely update user role (with validation)
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role TEXT,
  acting_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  valid_roles TEXT[] := ARRAY['admin', 'manager', 'employee'];
BEGIN
  -- Check if acting user is admin
  IF NOT public.user_has_role(acting_user_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Validate role
  IF new_role != ANY(valid_roles) THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Remove existing roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Add new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get role hierarchy level (for role comparison)
CREATE OR REPLACE FUNCTION public.get_role_level(role_name TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE role_name
    WHEN 'admin' THEN RETURN 3;
    WHEN 'manager' THEN RETURN 2;
    WHEN 'employee' THEN RETURN 1;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;