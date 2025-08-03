-- Handle existing users who might not have profiles yet
-- Create profiles for any existing users in auth.users

INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  u.raw_user_meta_data->>'avatar_url',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Assign default 'employee' role to existing users who don't have roles
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  u.id,
  'employee',
  NOW()
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Optional: Create a test admin user if you want to test with your email
-- Replace 'your-email@example.com' with your actual email
-- Uncomment the lines below and update the email:

/*
-- First, ensure the user exists and has a profile
DO $$
DECLARE
  user_email TEXT := 'drimdrim2002@naver.com';  -- Update this email
  user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  -- If user exists, make them admin
  IF user_id IS NOT NULL THEN
    -- Remove existing roles
    DELETE FROM public.user_roles WHERE user_id = user_id;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (user_id, 'admin', NOW());
    
    RAISE NOTICE 'User % has been granted admin role', user_email;
  ELSE
    RAISE NOTICE 'User % not found. Please sign up first.', user_email;
  END IF;
END $$;
*/