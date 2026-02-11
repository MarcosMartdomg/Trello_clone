-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Truncate profiles to force a clean regeneration with emails
-- WARNING: This deletes existing profiles but they will be recreated from auth.users
truncate table public.profiles cascade;

-- 2. Backfill profiles with IDs, names, and EMAILS from auth.users
insert into public.profiles (id, full_name, email, avatar_url)
select 
  id, 
  raw_user_meta_data->>'full_name', 
  email,
  raw_user_meta_data->>'avatar_url'
from auth.users;

-- 3. Verify
select count(*) as "Total Users" from auth.users;
select count(*) as "Total Profiles" from public.profiles;
select * from public.profiles limit 5;
