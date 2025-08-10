-- 1) Create course_enrollments table with RLS and counters trigger
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  payment_amount numeric DEFAULT 0,
  payment_provider text,
  payment_status text DEFAULT 'paid',
  currency text DEFAULT 'usd',
  progress numeric DEFAULT 0,
  completed boolean DEFAULT false
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies: students manage their own enrollments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND policyname = 'students_manage_own_enrollments'
  ) THEN
    CREATE POLICY students_manage_own_enrollments
    ON public.course_enrollments
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- Policy: creators can view enrollments for their courses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND policyname = 'creators_view_course_enrollments'
  ) THEN
    CREATE POLICY creators_view_course_enrollments
    ON public.course_enrollments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.educational_courses ec
        WHERE ec.id = course_enrollments.course_id AND ec.creator_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Unique: a student can enroll once per course
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'course_enrollments' AND indexname = 'uniq_course_enrollment_student_course'
  ) THEN
    CREATE UNIQUE INDEX uniq_course_enrollment_student_course
    ON public.course_enrollments (student_id, course_id);
  END IF;
END $$;

-- Trigger to keep educational_courses.total_students in sync
CREATE OR REPLACE FUNCTION public.update_course_student_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.educational_courses
    SET total_students = COALESCE(total_students, 0) + 1,
        updated_at = now()
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.educational_courses
    SET total_students = GREATEST(COALESCE(total_students, 0) - 1, 0),
        updated_at = now()
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_course_student_count_insert'
  ) THEN
    CREATE TRIGGER trg_update_course_student_count_insert
    AFTER INSERT ON public.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_course_student_count();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_course_student_count_delete'
  ) THEN
    CREATE TRIGGER trg_update_course_student_count_delete
    AFTER DELETE ON public.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_course_student_count();
  END IF;
END $$;

-- 2) Ensure user_badges table exists and extend for chapter/course badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_name text NOT NULL,
  description text,
  badge_type text NOT NULL DEFAULT 'chapter', -- 'chapter' | 'course'
  course_id uuid,
  lesson_id uuid,
  assignment_id uuid,
  earned_at timestamptz NOT NULL DEFAULT now(),
  is_public boolean NOT NULL DEFAULT true
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view badges (for profile visibility)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'badges_public_read'
  ) THEN
    CREATE POLICY badges_public_read
    ON public.user_badges
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Users can update visibility of their badges
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'users_update_own_badges'
  ) THEN
    CREATE POLICY users_update_own_badges
    ON public.user_badges
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Unique constraints to prevent dupes
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

-- 3) Course badge awarding when all required assignments are passed
CREATE OR REPLACE FUNCTION public.maybe_award_course_badge()
RETURNS trigger AS $$
DECLARE
  v_course_id uuid;
  v_required_count int;
  v_passed_count int;
  v_exists boolean;
BEGIN
  IF NEW.score IS NULL OR NEW.score < 80 THEN
    RETURN NEW;
  END IF;

  SELECT ca.course_id INTO v_course_id
  FROM public.course_assignments ca
  WHERE ca.id = NEW.assignment_id;

  IF v_course_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_required_count
  FROM public.course_assignments
  WHERE course_id = v_course_id AND (is_required IS TRUE);

  IF v_required_count = 0 THEN
    SELECT COUNT(*) INTO v_required_count
    FROM public.course_assignments
    WHERE course_id = v_course_id;
  END IF;

  SELECT COUNT(DISTINCT s.assignment_id) INTO v_passed_count
  FROM public.assignment_submissions s
  JOIN public.course_assignments a ON a.id = s.assignment_id
  WHERE s.student_id = NEW.student_id
    AND a.course_id = v_course_id
    AND s.score >= 80;

  IF v_passed_count >= v_required_count THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_badges
      WHERE user_id = NEW.student_id AND course_id = v_course_id AND badge_type = 'course'
    ) INTO v_exists;

    IF NOT v_exists THEN
      INSERT INTO public.user_badges (user_id, badge_name, description, course_id, assignment_id, badge_type)
      VALUES (NEW.student_id, 'Completed Course', 'Completed all required assessments', v_course_id, NEW.assignment_id, 'course');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_award_course_badge_on_submission'
  ) THEN
    CREATE TRIGGER trg_award_course_badge_on_submission
    AFTER INSERT OR UPDATE OF score ON public.assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION public.maybe_award_course_badge();
  END IF;
END $$;
