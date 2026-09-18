ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS has_children boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS child_ages text;
