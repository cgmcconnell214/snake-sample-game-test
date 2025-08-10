-- Fix RLS for course_lessons and course_assignments inserts/updates
DO $$ BEGIN
  -- course_lessons INSERT policy WITH CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_lessons' AND policyname = 'Creators can insert lessons for their courses'
  ) THEN
    CREATE POLICY "Creators can insert lessons for their courses"
    ON public.course_lessons
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;

  -- course_lessons UPDATE policy WITH CHECK (ensure updates remain in creator scope)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_lessons' AND policyname = 'Creators can update lessons for their courses (check)'
  ) THEN
    CREATE POLICY "Creators can update lessons for their courses (check)"
    ON public.course_lessons
    FOR UPDATE
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;

  -- course_assignments INSERT policy WITH CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_assignments' AND policyname = 'Creators can insert assignments for their courses'
  ) THEN
    CREATE POLICY "Creators can insert assignments for their courses"
    ON public.course_assignments
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;

  -- course_assignments UPDATE policy WITH CHECK
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_assignments' AND policyname = 'Creators can update assignments for their courses (check)'
  ) THEN
    CREATE POLICY "Creators can update assignments for their courses (check)"
    ON public.course_assignments
    FOR UPDATE
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Ensure course_enrollments table has required columns and policies
-- Create table if it does not exist (matches existing usage)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT,
  payment_provider TEXT,
  progress_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_status TEXT DEFAULT 'in_progress'
);

-- Add missing columns safely
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_date TIMESTAMPTZ NOT NULL DEFAULT now();

-- Enable RLS
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for course_enrollments
DO $$ BEGIN
  -- Students manage their own enrollment records
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND policyname = 'Students manage own enrollments'
  ) THEN
    CREATE POLICY "Students manage own enrollments"
    ON public.course_enrollments
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
  END IF;

  -- Creators can view and manage enrollments for their courses (SELECT, DELETE, UPDATE)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND policyname = 'Creators view enrollments for their courses'
  ) THEN
    CREATE POLICY "Creators view enrollments for their courses"
    ON public.course_enrollments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND policyname = 'Creators manage enrollments for their courses'
  ) THEN
    CREATE POLICY "Creators manage enrollments for their courses"
    ON public.course_enrollments
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND policyname = 'Creators can delete enrollments for their courses'
  ) THEN
    CREATE POLICY "Creators can delete enrollments for their courses"
    ON public.course_enrollments
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_created_at ON public.course_enrollments(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON public.course_enrollments(student_id);
