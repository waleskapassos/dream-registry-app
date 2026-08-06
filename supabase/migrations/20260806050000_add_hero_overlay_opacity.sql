ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_overlay_opacity integer NOT NULL DEFAULT 92
  CHECK (hero_overlay_opacity BETWEEN 0 AND 100);
