-- ============================================================
-- ROOTS AI — Stripe Subscription Profiles
-- Run this once in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- 1. Profiles table (one row per user, linked to auth.users)
create table if not exists public.profiles (
  id                    uuid references auth.users(id) on delete cascade primary key,
  is_pro                boolean not null default false,
  stripe_customer_id    text unique,
  stripe_subscription_id text,
  updated_at            timestamptz default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile (needed by useSubscription hook)
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Supabase service role (webhook) can do anything
create policy "Service role full access"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

-- 3. Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- After running: any new sign-up gets a profile row (is_pro=false).
-- Existing users: run this once to backfill their rows:
-- INSERT INTO public.profiles (id)
-- SELECT id FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
-- ============================================================
