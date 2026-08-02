ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS theme_primary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS theme_background text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS theme_accent text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_layout text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS hero_eyebrow text NOT NULL DEFAULT 'Vamos nos casar',
  ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS home_buttons jsonb NOT NULL DEFAULT '[]'::jsonb;