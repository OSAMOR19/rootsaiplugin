-- RLS FIX for Stems Bucket
-- Run this ENTIRE block in the Supabase SQL Editor

-- 1. Enable RLS on objects (just in case, usually already on)
alter table storage.objects enable row level security;

-- 2. Drop potential conflicting policies for 'stems' to start fresh
drop policy if exists "Allow Public Uploads to Stems" on storage.objects;
drop policy if exists "Allow Public Updates to Stems" on storage.objects;
drop policy if exists "Allow Public Select from Stems" on storage.objects;
drop policy if exists "Stems Insert" on storage.objects;
drop policy if exists "Stems Update" on storage.objects;
drop policy if exists "Stems Select" on storage.objects;

-- 3. Create explicit policies for ALL users (anon + authenticated)

-- INSERT (Upload)
create policy "Stems Insert"
on storage.objects for insert
to public
with check ( bucket_id = 'stems' );

-- UPDATE (Overwrite)
create policy "Stems Update"
on storage.objects for update
to public
using ( bucket_id = 'stems' );

-- SELECT (Read/Download)
create policy "Stems Select"
on storage.objects for select
to public
using ( bucket_id = 'stems' );

-- DELETE (Optional, if you want admins to delete via frontend)
create policy "Stems Delete"
on storage.objects for delete
to public
using ( bucket_id = 'stems' );
