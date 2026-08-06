CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  purchased_count integer NOT NULL DEFAULT 0 CHECK (purchased_count >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gifts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO authenticated;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gifts public read" ON public.gifts;
DROP POLICY IF EXISTS "gifts admin read" ON public.gifts;
DROP POLICY IF EXISTS "gifts admin insert" ON public.gifts;
DROP POLICY IF EXISTS "gifts admin update" ON public.gifts;
DROP POLICY IF EXISTS "gifts admin delete" ON public.gifts;

CREATE POLICY "gifts public read"
ON public.gifts FOR SELECT TO anon, authenticated
USING (is_active);

CREATE POLICY "gifts admin read"
ON public.gifts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "gifts admin insert"
ON public.gifts FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "gifts admin update"
ON public.gifts FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "gifts admin delete"
ON public.gifts FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

DROP TRIGGER IF EXISTS gifts_updated_at ON public.gifts;
CREATE TRIGGER gifts_updated_at
BEFORE UPDATE ON public.gifts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
