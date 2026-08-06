CREATE TABLE IF NOT EXISTS public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  couple_names text NOT NULL DEFAULT 'Nossos Nomes',
  wedding_date text NOT NULL DEFAULT '',
  ceremony_venue text NOT NULL DEFAULT '',
  ceremony_address text NOT NULL DEFAULT '',
  maps_url text NOT NULL DEFAULT '',
  ceremony_time text NOT NULL DEFAULT '',
  pix_key text NOT NULL DEFAULT '',
  pix_name text NOT NULL DEFAULT '',
  welcome_message text NOT NULL DEFAULT '',
  hero_image_url text NOT NULL DEFAULT '',
  hero_eyebrow text NOT NULL DEFAULT 'Vamos nos casar',
  hero_layout text NOT NULL DEFAULT 'full',
  theme_primary text NOT NULL DEFAULT '',
  theme_background text NOT NULL DEFAULT '',
  theme_accent text NOT NULL DEFAULT '',
  gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  home_buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
DROP POLICY IF EXISTS "settings admin insert" ON public.site_settings;
DROP POLICY IF EXISTS "settings admin update" ON public.site_settings;

CREATE POLICY "settings public read"
ON public.site_settings FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "settings admin insert"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'admin'
  )
);

CREATE POLICY "settings admin update"
ON public.site_settings FOR UPDATE TO authenticated
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

INSERT INTO public.site_settings (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;
