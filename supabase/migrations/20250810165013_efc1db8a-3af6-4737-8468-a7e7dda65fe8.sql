-- Create slug column for educational_courses if not exists
ALTER TABLE public.educational_courses
ADD COLUMN IF NOT EXISTS slug text;

-- Add unique index on slug (allow nulls but unique when present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'educational_courses_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX educational_courses_slug_unique_idx ON public.educational_courses (slug);
  END IF;
END $$;

-- Create table for creator-generated enrollment links
CREATE TABLE IF NOT EXISTS public.course_enrollment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_enrollment_links ENABLE ROW LEVEL SECURITY;

-- RLS: creators can manage their own links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollment_links' AND policyname = 'Creators manage their enrollment links'
  ) THEN
    CREATE POLICY "Creators manage their enrollment links"
    ON public.course_enrollment_links
    FOR ALL
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);
  END IF;
END $$;

-- Helpful index for lookups by code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_course_enrollment_links_code'
  ) THEN
    CREATE INDEX idx_course_enrollment_links_code ON public.course_enrollment_links (code);
  END IF;
END $$;
