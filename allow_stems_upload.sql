-- Allow public uploads to the 'stems' bucket
-- Run this in your Supabase SQL Editor

create policy "Allow Public Uploads to Stems"
on storage.objects for insert
to public
with check ( bucket_id = 'stems' );

-- Also allow updates (overwrite) if needed
create policy "Allow Public Updates to Stems"
on storage.objects for update
to public
using ( bucket_id = 'stems' );

-- Allow public read (already covered by "Public Bucket" setting, but good to be explicit)
create policy "Allow Public Select from Stems"
on storage.objects for select
to public
using ( bucket_id = 'stems' );
