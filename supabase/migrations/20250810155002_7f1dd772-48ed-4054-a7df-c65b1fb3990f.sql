-- Create a public storage bucket for course videos
insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', true)
on conflict (id) do nothing;

-- Storage policies for course-videos
create policy if not exists "Course videos are publicly accessible"
on storage.objects
for select
using (bucket_id = 'course-videos');

create policy if not exists "Authenticated users can upload course videos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'course-videos');

-- Optional: Allow creators to update/delete their uploads would require owner tracking; keep minimal and secure by disallowing updates/deletes by default

-- Create user_badges table to track awarded badges
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

-- RLS: Users can view their own badges
create policy if not exists "users_own_badges"
on public.user_badges
for select
using (auth.uid() = user_id);

-- RLS: Course creators can view badges for their course assignments
create policy if not exists "creators_view_course_badges"
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

-- Unique constraint to avoid duplicate badges per assignment
create unique index if not exists user_badges_unique_per_assignment
on public.user_badges (user_id, assignment_id, badge_name);

-- Function and trigger to auto-award completion badge when score >= 80
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
  -- Only proceed if score is available and >= 80
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

  -- Avoid duplicates
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

-- Trigger on assignment_submissions
create trigger trg_award_completion_badge
after insert on public.assignment_submissions
for each row
execute function public.award_completion_badge();