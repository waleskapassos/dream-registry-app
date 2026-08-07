ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS typography_styles jsonb NOT NULL DEFAULT '{
    "couple_names":{"font":"elegant","color":"","size":72,"bold":false,"italic":false},
    "wedding_date":{"font":"elegant","color":"","size":20,"bold":false,"italic":false},
    "eyebrow":{"font":"modern","color":"","size":11,"bold":false,"italic":false},
    "heading":{"font":"elegant","color":"","size":40,"bold":false,"italic":false},
    "body":{"font":"modern","color":"","size":14,"bold":false,"italic":false}
  }'::jsonb;
