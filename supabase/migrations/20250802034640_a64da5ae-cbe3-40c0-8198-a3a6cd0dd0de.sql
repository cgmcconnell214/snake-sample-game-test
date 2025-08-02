-- Enhanced Learning Platform Database Structure

-- Course content and lessons table
CREATE TABLE public.course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  lesson_type TEXT DEFAULT 'video' CHECK (lesson_type IN ('video', 'text', 'quiz', 'assignment')),
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Course progress tracking
CREATE TABLE public.course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Course reviews and ratings
CREATE TABLE public.course_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Certification system
CREATE TABLE public.certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  badge_image_url TEXT,
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  points_required INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User certifications earned
CREATE TABLE public.user_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  verification_code TEXT UNIQUE,
  certificate_url TEXT,
  UNIQUE(user_id, certification_id)
);

-- Skills and competencies
CREATE TABLE public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Course skills mapping
CREATE TABLE public.course_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  UNIQUE(course_id, skill_id)
);

-- User skill levels
CREATE TABLE public.user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 0,
  experience_points INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Enhanced live classes with detailed management
CREATE TABLE public.class_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.live_classes(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  recording_url TEXT,
  session_notes TEXT,
  attendance_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Class session attendance tracking
CREATE TABLE public.session_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, attendee_id)
);

-- Course assignments and assessments
CREATE TABLE public.course_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'quiz' CHECK (assignment_type IN ('quiz', 'essay', 'project', 'practical')),
  questions JSONB DEFAULT '[]',
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  attempts_allowed INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student assignment submissions
CREATE TABLE public.assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  submission_data JSONB DEFAULT '{}',
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  graded_at TIMESTAMPTZ,
  graded_by UUID,
  attempt_number INTEGER DEFAULT 1,
  time_spent_minutes INTEGER DEFAULT 0
);

-- Discussion forums for courses
CREATE TABLE public.course_discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_instructor_post BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.course_discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Learning paths and curricula
CREATE TABLE public.learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_weeks INTEGER DEFAULT 1,
  prerequisites JSONB DEFAULT '[]',
  outcomes JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Courses in learning paths
CREATE TABLE public.learning_path_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.educational_courses(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  UNIQUE(learning_path_id, course_id),
  UNIQUE(learning_path_id, sequence_order)
);

-- User learning path enrollments
CREATE TABLE public.learning_path_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage NUMERIC DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_course_id UUID REFERENCES public.educational_courses(id),
  UNIQUE(user_id, learning_path_id)
);

-- Enable RLS on all tables
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_lessons
CREATE POLICY "Anyone can view lessons of published courses" ON public.course_lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.educational_courses 
    WHERE id = course_lessons.course_id AND is_published = true
  )
);

CREATE POLICY "Course creators can manage their course lessons" ON public.course_lessons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.educational_courses 
    WHERE id = course_lessons.course_id AND creator_id = auth.uid()
  )
);

-- RLS Policies for course_progress
CREATE POLICY "Users can view and manage their own progress" ON public.course_progress
FOR ALL USING (auth.uid() = student_id);

-- RLS Policies for course_reviews
CREATE POLICY "Anyone can view course reviews" ON public.course_reviews
FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for courses they enrolled in" ON public.course_reviews
FOR INSERT WITH CHECK (
  auth.uid() = student_id AND
  EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = course_reviews.course_id AND student_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own reviews" ON public.course_reviews
FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for certifications
CREATE POLICY "Anyone can view active certifications" ON public.certifications
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage certifications" ON public.certifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for user_certifications
CREATE POLICY "Users can view their own certifications" ON public.user_certifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can issue certifications" ON public.user_certifications
FOR INSERT WITH CHECK (true);

-- RLS Policies for skills
CREATE POLICY "Anyone can view skills" ON public.skills
FOR SELECT USING (true);

CREATE POLICY "Admins can manage skills" ON public.skills
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for course_skills
CREATE POLICY "Anyone can view course skills" ON public.course_skills
FOR SELECT USING (true);

CREATE POLICY "Course creators can manage their course skills" ON public.course_skills
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.educational_courses 
    WHERE id = course_skills.course_id AND creator_id = auth.uid()
  )
);

-- RLS Policies for user_skills
CREATE POLICY "Users can view and manage their own skills" ON public.user_skills
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for class_sessions
CREATE POLICY "Anyone can view sessions of public classes" ON public.class_sessions
FOR SELECT USING (true);

CREATE POLICY "Class hosts can manage their sessions" ON public.class_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.live_classes 
    WHERE id = class_sessions.class_id AND host_id = auth.uid()
  )
);

-- RLS Policies for session_attendance
CREATE POLICY "Users can view their own attendance" ON public.session_attendance
FOR SELECT USING (auth.uid() = attendee_id);

CREATE POLICY "Class hosts can view all attendance for their sessions" ON public.session_attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.class_sessions cs
    JOIN public.live_classes lc ON cs.class_id = lc.id
    WHERE cs.id = session_attendance.session_id AND lc.host_id = auth.uid()
  )
);

CREATE POLICY "Users can mark their own attendance" ON public.session_attendance
FOR INSERT WITH CHECK (auth.uid() = attendee_id);

-- RLS Policies for course_assignments
CREATE POLICY "Students can view assignments for enrolled courses" ON public.course_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = course_assignments.course_id AND student_id = auth.uid()
  )
);

CREATE POLICY "Course creators can manage their course assignments" ON public.course_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.educational_courses 
    WHERE id = course_assignments.course_id AND creator_id = auth.uid()
  )
);

-- RLS Policies for assignment_submissions
CREATE POLICY "Students can view and manage their own submissions" ON public.assignment_submissions
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Course creators can view submissions for their assignments" ON public.assignment_submissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_assignments ca
    JOIN public.educational_courses ec ON ca.course_id = ec.id
    WHERE ca.id = assignment_submissions.assignment_id AND ec.creator_id = auth.uid()
  )
);

-- RLS Policies for course_discussions
CREATE POLICY "Students can view discussions for enrolled courses" ON public.course_discussions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = course_discussions.course_id AND student_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.educational_courses 
    WHERE id = course_discussions.course_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Students can create discussions for enrolled courses" ON public.course_discussions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.course_enrollments 
    WHERE course_id = course_discussions.course_id AND student_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own discussions" ON public.course_discussions
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for learning_paths
CREATE POLICY "Anyone can view public learning paths" ON public.learning_paths
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own learning paths" ON public.learning_paths
FOR ALL USING (auth.uid() = created_by);

-- RLS Policies for learning_path_courses
CREATE POLICY "Anyone can view learning path courses" ON public.learning_path_courses
FOR SELECT USING (true);

CREATE POLICY "Learning path creators can manage their path courses" ON public.learning_path_courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.learning_paths 
    WHERE id = learning_path_courses.learning_path_id AND created_by = auth.uid()
  )
);

-- RLS Policies for learning_path_enrollments
CREATE POLICY "Users can view and manage their own learning path enrollments" ON public.learning_path_enrollments
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_progress_student_course ON public.course_progress(student_id, course_id);
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX idx_user_certifications_user_id ON public.user_certifications(user_id);
CREATE INDEX idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX idx_session_attendance_session_id ON public.session_attendance(session_id);
CREATE INDEX idx_course_assignments_course_id ON public.course_assignments(course_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_course_discussions_course_id ON public.course_discussions(course_id);
CREATE INDEX idx_learning_path_courses_path_id ON public.learning_path_courses(learning_path_id);

-- Add triggers for updating timestamps
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
  BEFORE UPDATE ON public.course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_assignments_updated_at
  BEFORE UPDATE ON public.course_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_discussions_updated_at
  BEFORE UPDATE ON public.course_discussions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default skills
INSERT INTO public.skills (name, category, description) VALUES
('Blockchain Fundamentals', 'Blockchain', 'Understanding basic blockchain concepts and principles'),
('Smart Contracts', 'Blockchain', 'Creating and deploying smart contracts'),
('Tokenization', 'Blockchain', 'Converting assets into digital tokens'),
('Compliance', 'Legal', 'Understanding regulatory requirements'),
('Risk Management', 'Finance', 'Identifying and managing financial risks'),
('Trading Strategies', 'Trading', 'Developing effective trading approaches'),
('Technical Analysis', 'Trading', 'Analyzing market data and charts'),
('Portfolio Management', 'Finance', 'Managing investment portfolios'),
('Cryptocurrency', 'Blockchain', 'Understanding digital currencies'),
('DeFi Protocols', 'Blockchain', 'Decentralized finance concepts and applications');

-- Insert some default certifications
INSERT INTO public.certifications (name, description, skill_level, points_required, created_by) VALUES
('Blockchain Basics Certificate', 'Foundation level certification in blockchain technology', 'beginner', 100, '00000000-0000-0000-0000-000000000000'),
('Advanced Tokenization Specialist', 'Expert level certification in asset tokenization', 'advanced', 500, '00000000-0000-0000-0000-000000000000'),
('Compliance Officer Certification', 'Professional certification in regulatory compliance', 'intermediate', 300, '00000000-0000-0000-0000-000000000000'),
('DeFi Protocol Specialist', 'Advanced certification in decentralized finance', 'expert', 750, '00000000-0000-0000-0000-000000000000'),
('Sacred Commerce Practitioner', 'Certification in divine trust and sacred law principles', 'intermediate', 400, '00000000-0000-0000-0000-000000000000');