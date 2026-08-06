CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visits public insert" ON public.site_visits;
DROP POLICY IF EXISTS "visits admin read" ON public.site_visits;

CREATE POLICY "visits public insert"
ON public.site_visits FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "visits admin read"
ON public.site_visits FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);
