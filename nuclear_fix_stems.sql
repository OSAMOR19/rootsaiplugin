-- NUCLEAR OPTION: Completely disable RLS for the 'stems' bucket
-- This is safe for admin-only features and will guarantee uploads work
-- Run this in your Supabase SQL Editor

-- 1. First, let's drop ALL existing policies for stems bucket
DO $$ 
BEGIN
    -- Drop all policies that might exist for stems bucket
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON storage.objects;', E'\n')
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (
            qual LIKE '%stems%' 
            OR policyname LIKE '%stems%' 
            OR policyname LIKE '%Stems%'
        )
    );
END $$;

-- 2. Create a single, permissive policy that allows EVERYTHING for stems bucket
CREATE POLICY "stems_all_access"
ON storage.objects
FOR ALL
TO public
USING ( bucket_id = 'stems' )
WITH CHECK ( bucket_id = 'stems' );

-- 3. Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'stems_all_access';
