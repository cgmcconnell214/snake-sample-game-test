-- First, let's check the current RLS policies on profiles table that are causing infinite recursion
SELECT 
    polname AS policy_name,
    polcmd AS policy_command,
    polqual AS using_expression,
    polwithcheck AS with_check_expression
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'profiles'
ORDER BY polname;

-- Also check what RLS policies exist on kyc_verification
SELECT 
    polname AS policy_name,
    polcmd AS policy_command,
    polqual AS using_expression,
    polwithcheck AS with_check_expression
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'kyc_verification'
ORDER BY polname;