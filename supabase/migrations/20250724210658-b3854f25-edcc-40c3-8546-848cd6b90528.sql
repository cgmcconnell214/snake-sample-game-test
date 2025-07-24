-- Create AI Agents marketplace tables
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'workflow',
  category TEXT NOT NULL,
  price_per_use NUMERIC NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 1000000,
  tokens_sold BIGINT NOT NULL DEFAULT 0,
  configuration JSONB NOT NULL DEFAULT '{}',
  workflow_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI Agent purchases table
CREATE TABLE IF NOT EXISTS public.ai_agent_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  tokens_purchased BIGINT NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Educational Courses table
CREATE TABLE IF NOT EXISTS public.educational_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_per_student NUMERIC NOT NULL DEFAULT 0,
  course_content JSONB NOT NULL DEFAULT '[]',
  requirements JSONB NOT NULL DEFAULT '[]',
  total_students INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Course Enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_status TEXT NOT NULL DEFAULT 'enrolled',
  progress_data JSONB NOT NULL DEFAULT '{}',
  payment_amount NUMERIC NOT NULL
);

-- Create Divine Trust Documents table
CREATE TABLE IF NOT EXISTS public.divine_trust_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_data JSONB NOT NULL DEFAULT '{}',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Kingdom Entry Records table
CREATE TABLE IF NOT EXISTS public.kingdom_entry_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL,
  entry_data JSONB NOT NULL DEFAULT '{}',
  trust_level INTEGER NOT NULL DEFAULT 1,
  witness_signatures JSONB NOT NULL DEFAULT '[]',
  document_refs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Sacred Law Principles table
CREATE TABLE IF NOT EXISTS public.sacred_law_principles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  principle_order INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL,
  is_prerequisite BOOLEAN NOT NULL DEFAULT false,
  prerequisite_for JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Live Classes table
CREATE TABLE IF NOT EXISTS public.live_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  class_type TEXT NOT NULL DEFAULT 'education',
  price_per_attendee NUMERIC NOT NULL DEFAULT 0,
  max_attendees INTEGER,
  zoom_meeting_id TEXT,
  zoom_password TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_monetized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Class Attendees table
CREATE TABLE IF NOT EXISTS public.class_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  attendee_id UUID NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  attendance_status TEXT NOT NULL DEFAULT 'registered'
);

-- Enable RLS on all new tables
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divine_trust_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingdom_entry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sacred_law_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AI Agents
CREATE POLICY "Public AI agents are viewable by everyone" 
ON public.ai_agents 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Creators can manage their AI agents" 
ON public.ai_agents 
FOR ALL 
USING (auth.uid() = creator_id);

-- Create RLS policies for AI Agent purchases
CREATE POLICY "Users can view their AI agent purchases" 
ON public.ai_agent_purchases 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create AI agent purchases" 
ON public.ai_agent_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Create RLS policies for Educational Courses
CREATE POLICY "Published courses are viewable by everyone" 
ON public.educational_courses 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Creators can manage their courses" 
ON public.educational_courses 
FOR ALL 
USING (auth.uid() = creator_id);

-- Create RLS policies for Course Enrollments
CREATE POLICY "Students can view their enrollments" 
ON public.course_enrollments 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll in courses" 
ON public.course_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Create RLS policies for Divine Trust Documents
CREATE POLICY "Admin can manage divine trust documents" 
ON public.divine_trust_documents 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::user_role))));

CREATE POLICY "Users can view approved documents" 
ON public.divine_trust_documents 
FOR SELECT 
USING (approval_status = 'approved');

-- Create RLS policies for Kingdom Entry Records
CREATE POLICY "Users can view their kingdom entries" 
ON public.kingdom_entry_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create kingdom entries" 
ON public.kingdom_entry_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all kingdom entries" 
ON public.kingdom_entry_records 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::user_role))));

-- Create RLS policies for Sacred Law Principles
CREATE POLICY "Everyone can view sacred law principles" 
ON public.sacred_law_principles 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage sacred law principles" 
ON public.sacred_law_principles 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::user_role))));

-- Create RLS policies for Live Classes
CREATE POLICY "Everyone can view live classes" 
ON public.live_classes 
FOR SELECT 
USING (true);

CREATE POLICY "Hosts can manage their classes" 
ON public.live_classes 
FOR ALL 
USING (auth.uid() = host_id);

-- Create RLS policies for Class Attendees
CREATE POLICY "Users can view their class registrations" 
ON public.class_attendees 
FOR SELECT 
USING (auth.uid() = attendee_id);

CREATE POLICY "Users can register for classes" 
ON public.class_attendees 
FOR INSERT 
WITH CHECK (auth.uid() = attendee_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_ai_agents_updated_at
BEFORE UPDATE ON public.ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_courses_updated_at
BEFORE UPDATE ON public.educational_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_divine_trust_documents_updated_at
BEFORE UPDATE ON public.divine_trust_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sacred_law_principles_updated_at
BEFORE UPDATE ON public.sacred_law_principles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();