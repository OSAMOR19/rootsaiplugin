-- Add yearly billing support columns to profiles
-- Run this in the Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS billing_interval text DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz;
