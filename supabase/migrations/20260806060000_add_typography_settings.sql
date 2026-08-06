ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS font_heading text NOT NULL DEFAULT 'elegant',
  ADD COLUMN IF NOT EXISTS font_body text NOT NULL DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS font_heading_weight integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS font_body_weight integer NOT NULL DEFAULT 400,
  ADD COLUMN IF NOT EXISTS font_heading_style text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS font_body_style text NOT NULL DEFAULT 'normal';
