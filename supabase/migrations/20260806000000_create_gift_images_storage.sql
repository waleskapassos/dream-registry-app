-- The deployed project may not have received the original authorization migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
CREATE POLICY "own roles readable"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Private bucket: images are served with signed URLs generated for administrators.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gift-images',
  'gift-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "gift images admin select" ON storage.objects;
DROP POLICY IF EXISTS "gift images admin insert" ON storage.objects;
DROP POLICY IF EXISTS "gift images admin update" ON storage.objects;
DROP POLICY IF EXISTS "gift images admin delete" ON storage.objects;

CREATE POLICY "gift images admin select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'gift-images'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  )
);

CREATE POLICY "gift images admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'gift-images'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  )
);

CREATE POLICY "gift images admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'gift-images'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'gift-images'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  )
);

CREATE POLICY "gift images admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'gift-images'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  )
);
