ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS theme_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_overlay_opacity integer NOT NULL DEFAULT 92,
  ADD COLUMN IF NOT EXISTS font_heading text NOT NULL DEFAULT 'elegant',
  ADD COLUMN IF NOT EXISTS font_body text NOT NULL DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS font_heading_weight integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS font_body_weight integer NOT NULL DEFAULT 400,
  ADD COLUMN IF NOT EXISTS font_heading_style text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS font_body_style text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS typography_styles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS youtube_music_url text NOT NULL DEFAULT '';

ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS nubank_payment_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nubank_credit_payment_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nubank_debit_payment_url text NOT NULL DEFAULT '';

ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS companion_names text,
  ADD COLUMN IF NOT EXISTS has_children boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS child_ages text;

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view site visits"
  ON public.site_visits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));