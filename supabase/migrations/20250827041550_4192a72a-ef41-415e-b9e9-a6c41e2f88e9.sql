-- Find all views and their definitions to identify SECURITY DEFINER views
-- Look in the system catalog for views with security_definer property

-- Query to find views with security definer
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- Also check pg_class for any views with special security properties
SELECT 
    n.nspname as schema_name,
    c.relname as view_name,
    c.relkind,
    c.relacl
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'v' 
AND n.nspname = 'public'
ORDER BY c.relname;

-- The issue might be that we need to check for functions that create views with SECURITY DEFINER
-- Let's also check function definitions that might contain view creation
SELECT 
    proname,
    prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND prosrc ILIKE '%SECURITY DEFINER%'
AND prosrc ILIKE '%VIEW%'
ORDER BY proname;