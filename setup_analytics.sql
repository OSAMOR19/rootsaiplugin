-- ============================================================
-- ROOTS AI — Analytics Telemetry Tracking
-- Create this table to let the dashboard graph real data!
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('play', 'download')),
  item_type text NOT NULL CHECK (item_type IN ('sample', 'pack')),
  item_id uuid NOT NULL,
  pack_id uuid, -- So we can easily track which packs get the most engagement
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for insanely fast aggregation grouping by day
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- Read access restricted to admins (service role). Inserts can be handled securely server-side.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on analytics"
  ON public.analytics_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
