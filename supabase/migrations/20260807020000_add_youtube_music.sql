ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS youtube_music_url text NOT NULL DEFAULT '';
