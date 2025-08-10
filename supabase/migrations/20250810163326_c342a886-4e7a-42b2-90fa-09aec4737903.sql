-- Add missing columns to user_badges if they don't exist, then create indexes
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_badges'
  ) THEN
    BEGIN
      ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS badge_type text NOT NULL DEFAULT 'chapter';
    EXCEPTION WHEN duplicate_column THEN
      -- ignore
      NULL;
    END;
    BEGIN
      ALTER TABLE public.user_badges ADD COLUMN IF NOT EXISTS lesson_id uuid;
    EXCEPTION WHEN duplicate_column THEN
      NULL;
    END;
  ELSE
    -- Create full table if missing
    CREATE TABLE public.user_badges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      badge_name text NOT NULL,
      description text,
      badge_type text NOT NULL DEFAULT 'chapter',
      course_id uuid,
      lesson_id uuid,
      assignment_id uuid,
      earned_at timestamptz NOT NULL DEFAULT now(),
      is_public boolean NOT NULL DEFAULT true
    );
    ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Ensure policies exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'badges_public_read'
  ) THEN
    CREATE POLICY badges_public_read ON public.user_badges FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'users_update_own_badges'
  ) THEN
    CREATE POLICY users_update_own_badges ON public.user_badges FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create unique indexes safely
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_badges' AND indexname = 'uniq_user_lesson_badge'
  ) THEN
    CREATE UNIQUE INDEX uniq_user_lesson_badge
    ON public.user_badges (user_id, lesson_id)
    WHERE lesson_id IS NOT NULL AND badge_type = 'chapter';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_badges' AND indexname = 'uniq_user_course_badge'
  ) THEN
    CREATE UNIQUE INDEX uniq_user_course_badge
    ON public.user_badges (user_id, course_id, badge_type)
    WHERE course_id IS NOT NULL AND badge_type = 'course';
  END IF;
END $$;
