-- Idempotent creation of course-videos bucket
insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', true)
on conflict (id) do nothing;

-- Storage policies for course-videos (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Course videos are publicly accessible'
  ) then
    create policy "Course videos are publicly accessible"
    on storage.objects
    for select
    using (bucket_id = 'course-videos');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload course videos'
  ) then
    create policy "Authenticated users can upload course videos"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'course-videos');
  end if;
end $$;

-- Create user_badges table
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_name text not null,
  description text,
  icon_url text,
  course_id uuid,
  assignment_id uuid,
  awarded_at timestamptz not null default now()
);

alter table public.user_badges enable row level security;

-- RLS policies for user_badges (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_badges' and policyname = 'users_own_badges'
  ) then
    create policy users_own_badges
    on public.user_badges
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_badges' and policyname = 'creators_view_course_badges'
  ) then
    create policy creators_view_course_badges
    on public.user_badges
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.course_assignments ca
        join public.educational_courses ec on ec.id = ca.course_id
        where ca.id = user_badges.assignment_id
          and ec.creator_id = auth.uid()
      )
    );
  end if;
end $$;

-- Unique constraint to avoid duplicate badges per assignment
create unique index if not exists user_badges_unique_per_assignment
on public.user_badges (user_id, assignment_id, badge_name);

-- Function to auto-award completion badge when score >= 80
create or replace function public.award_completion_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_badge_name text;
  v_exists boolean;
  v_title text;
begin
  if NEW.score is null or NEW.score < 80 then
    return NEW;
  end if;

  select ca.course_id, ca.title into v_course_id, v_title
  from public.course_assignments ca
  where ca.id = NEW.assignment_id;

  if v_course_id is null then
    return NEW;
  end if;
  
  v_badge_name := coalesce('Completed: ' || v_title, 'Course Completion');

  select exists (
    select 1 from public.user_badges
    where user_id = NEW.student_id
      and assignment_id = NEW.assignment_id
      and badge_name = v_badge_name
  ) into v_exists;

  if not v_exists then
    insert into public.user_badges (user_id, badge_name, description, course_id, assignment_id)
    values (
      NEW.student_id,
      v_badge_name,
      'Awarded for scoring >= 80% on a course assessment',
      v_course_id,
      NEW.assignment_id
    );
  end if;

  return NEW;
end;
$$;

-- Trigger creation (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_award_completion_badge'
  ) THEN
    CREATE TRIGGER trg_award_completion_badge
    AFTER INSERT ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.award_completion_badge();
  END IF;
END$$;