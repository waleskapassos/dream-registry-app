CREATE TABLE IF NOT EXISTS public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  attending boolean NOT NULL DEFAULT true,
  guests integer NOT NULL DEFAULT 0 CHECK (guests >= 0 AND guests <= 20),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.rsvps TO anon, authenticated;
GRANT SELECT, DELETE ON public.rsvps TO authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsvp public insert" ON public.rsvps;
DROP POLICY IF EXISTS "rsvp admin read" ON public.rsvps;
DROP POLICY IF EXISTS "rsvp admin delete" ON public.rsvps;

CREATE POLICY "rsvp public insert"
ON public.rsvps FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "rsvp admin read"
ON public.rsvps FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "rsvp admin delete"
ON public.rsvps FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);
