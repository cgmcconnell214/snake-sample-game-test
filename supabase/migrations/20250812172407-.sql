-- Create course_creator_drafts table for autosaving Course Creator form
CREATE TABLE IF NOT EXISTS public.course_creator_drafts (
  user_id uuid PRIMARY KEY,
  selected_course_id uuid REFERENCES public.educational_courses(id) ON DELETE SET NULL,
  max_uses integer NOT NULL DEFAULT 10,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_creator_drafts ENABLE ROW LEVEL SECURITY;

-- RLS: users manage their own draft
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='course_creator_drafts' AND policyname='Users manage own course drafts'
  ) THEN
    CREATE POLICY "Users manage own course drafts" ON public.course_creator_drafts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Upsert convenience: unique on (user_id) already primary key

-- Create onboarding_progress table used by Onboarding page
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id uuid NOT NULL,
  step_key text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, step_key)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='onboarding_progress' AND policyname='Users manage their onboarding progress'
  ) THEN
    CREATE POLICY "Users manage their onboarding progress" ON public.onboarding_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create sync_events table to track data sync job status
CREATE TABLE IF NOT EXISTS public.sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

-- Anyone can read sync status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sync_events' AND policyname='Everyone can read sync events'
  ) THEN
    CREATE POLICY "Everyone can read sync events" ON public.sync_events
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Only admins can modify sync events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sync_events' AND policyname='Admins manage sync events'
  ) THEN
    CREATE POLICY "Admins manage sync events" ON public.sync_events
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_sync_events_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_sync_events_updated_at
    BEFORE UPDATE ON public.sync_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Add missing column referenced by KYC Center
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz;

-- Ensure storage bucket exists for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kyc-documents bucket
DO $$ BEGIN
  -- View own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='KYC users can view own'
  ) THEN
    CREATE POLICY "KYC users can view own" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Upload own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='KYC users can upload own'
  ) THEN
    CREATE POLICY "KYC users can upload own" ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Update own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='KYC users can update own'
  ) THEN
    CREATE POLICY "KYC users can update own" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- Delete own documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='KYC users can delete own'
  ) THEN
    CREATE POLICY "KYC users can delete own" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;