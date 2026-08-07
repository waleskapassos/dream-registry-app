ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS companion_names text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text;
