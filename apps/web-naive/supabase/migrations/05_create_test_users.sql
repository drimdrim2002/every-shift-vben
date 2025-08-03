-- Create test users for development
-- Note: These should be created via Supabase Auth, not directly in the database
-- This script is for reference only and should be used after creating users via the application

-- For reference, here are the test users you should create:
-- 1. Admin User: admin@example.com / 123456
-- 2. Manager User: manager@example.com / 123456  
-- 3. Employee User: employee@example.com / 123456

-- After creating these users through signup, run this script to assign proper roles:

-- Update user roles for test accounts
DO $$
DECLARE
  admin_user_id UUID;
  manager_user_id UUID;
  employee_user_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';
  SELECT id INTO manager_user_id FROM auth.users WHERE email = 'manager@example.com';
  SELECT id INTO employee_user_id FROM auth.users WHERE email = 'employee@example.com';
  
  -- Update admin user role
  IF admin_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (admin_user_id, 'admin', NOW());
    
    -- Update profile with proper names
    UPDATE public.profiles 
    SET full_name = 'Admin User', username = 'admin', updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin user role updated: %', admin_user_id;
  END IF;
  
  -- Update manager user role
  IF manager_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = manager_user_id;
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (manager_user_id, 'manager', NOW());
    
    -- Update profile with proper names
    UPDATE public.profiles 
    SET full_name = 'Manager User', username = 'manager', updated_at = NOW()
    WHERE id = manager_user_id;
    
    RAISE NOTICE 'Manager user role updated: %', manager_user_id;
  END IF;
  
  -- Update employee user role (already default, but ensure it's set)
  IF employee_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = employee_user_id;
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (employee_user_id, 'employee', NOW());
    
    -- Update profile with proper names
    UPDATE public.profiles 
    SET full_name = 'Employee User', username = 'employee', updated_at = NOW()
    WHERE id = employee_user_id;
    
    RAISE NOTICE 'Employee user role updated: %', employee_user_id;
  END IF;
  
  -- Show summary
  RAISE NOTICE 'Test user roles setup complete!';
  RAISE NOTICE 'Make sure to create these users via the application first:';
  RAISE NOTICE '1. admin@example.com / 123456 (Admin)';
  RAISE NOTICE '2. manager@example.com / 123456 (Manager)';
  RAISE NOTICE '3. employee@example.com / 123456 (Employee)';
END $$;