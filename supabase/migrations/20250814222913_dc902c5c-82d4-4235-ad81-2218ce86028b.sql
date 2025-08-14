-- Corrected security migration: create MFA and agent secrets tables and add XRPL policies
-- No changes to views to avoid previous error source

-- 1) MFA table
create table if not exists public.user_mfa (
  user_id uuid primary key,
  totp_secret text not null,
  enabled boolean not null default false,
  backup_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_mfa enable row level security;

-- Insert own
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='user_mfa' and policyname='Users can insert their own MFA'
  ) then
    create policy "Users can insert their own MFA" on public.user_mfa
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Update own
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='user_mfa' and policyname='Users can update their own MFA'
  ) then
    create policy "Users can update their own MFA" on public.user_mfa
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Delete own
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='user_mfa' and policyname='Users can delete their own MFA'
  ) then
    create policy "Users can delete their own MFA" on public.user_mfa
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- updated_at trigger for user_mfa
do $$ begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='user_mfa' and t.tgname='update_user_mfa_updated_at'
  ) then
    create trigger update_user_mfa_updated_at
    before update on public.user_mfa
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- 2) AI agent secrets table (service-role access only)
create table if not exists public.ai_agent_secrets (
  agent_id uuid primary key,
  secrets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_agent_secrets enable row level security;
-- No client policies by design; service role only

-- updated_at trigger for ai_agent_secrets
do $$ begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='ai_agent_secrets' and t.tgname='update_ai_agent_secrets_updated_at'
  ) then
    create trigger update_ai_agent_secrets_updated_at
    before update on public.ai_agent_secrets
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- 3) Harden XRPL table with explicit policies
alter table public."XRPL" enable row level security;

-- Public read policy
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='XRPL' and policyname='Public can read XRPL'
  ) then
    create policy "Public can read XRPL" on public."XRPL"
      for select
      using (true);
  end if;
end $$;

-- Admin manage policy
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='XRPL' and policyname='Admins manage XRPL'
  ) then
    create policy "Admins manage XRPL" on public."XRPL"
      for all
      using (exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.role = 'admin'
      ))
      with check (exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid() and p.role = 'admin'
      ));
  end if;
end $$;