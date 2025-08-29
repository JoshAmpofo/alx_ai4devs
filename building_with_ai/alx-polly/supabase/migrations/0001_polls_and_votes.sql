-- 0001_polls_and_votes.sql
-- Schema for polls, options, and votes with RLS policies and constraints

-- Extensions (Supabase usually has pgcrypto enabled, but this is idempotent)
create extension if not exists pgcrypto;

--
-- Tables
--

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(btrim(question)) > 0),
  description text null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_polls_created_by on public.polls(created_by);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (length(btrim(label)) > 0),
  created_at timestamptz not null default now(),
  -- ensures no duplicate labels per poll
  unique (poll_id, label)
);

-- This unique constraint allows us to reference (option_id, poll_id) from votes
do $$ begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'poll_options_id_poll_id_key'
  ) then
    alter table public.poll_options add constraint poll_options_id_poll_id_key unique (id, poll_id);
  end if;
end $$;

create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null,
  voter_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- ensure the option belongs to the poll
  constraint fk_vote_option_in_poll foreign key (option_id, poll_id)
    references public.poll_options(id, poll_id)
    on delete cascade
);

create index if not exists idx_votes_poll_id on public.votes(poll_id);
create index if not exists idx_votes_option_id on public.votes(option_id);

-- One vote per authenticated user per poll (allows multiple for anon since voter_id is null)
create unique index if not exists votes_one_per_user_per_poll
  on public.votes(poll_id, voter_id)
  where voter_id is not null;

--
-- Row Level Security (RLS)
--
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;

-- Polls policies
do $$ begin
  -- Read for everyone (anon + authenticated)
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'polls' and policyname = 'Polls allow read to all'
  ) then
    create policy "Polls allow read to all"
      on public.polls
      for select
      using (true);
  end if;

  -- Insert only by authenticated users, must set created_by = auth.uid()
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'polls' and policyname = 'Polls insert by owner'
  ) then
    create policy "Polls insert by owner"
      on public.polls
      for insert
      to authenticated
      with check (created_by = auth.uid());
  end if;

  -- Update only by owner
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'polls' and policyname = 'Polls update by owner'
  ) then
    create policy "Polls update by owner"
      on public.polls
      for update
      to authenticated
      using (created_by = auth.uid())
      with check (created_by = auth.uid());
  end if;

  -- Delete only by owner
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'polls' and policyname = 'Polls delete by owner'
  ) then
    create policy "Polls delete by owner"
      on public.polls
      for delete
      to authenticated
      using (created_by = auth.uid());
  end if;
end $$;

-- Poll options policies
do $$ begin
  -- Read for everyone
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'poll_options' and policyname = 'Options allow read to all'
  ) then
    create policy "Options allow read to all"
      on public.poll_options
      for select
      using (true);
  end if;

  -- Insert by poll owner
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'poll_options' and policyname = 'Options insert by poll owner'
  ) then
    create policy "Options insert by poll owner"
      on public.poll_options
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.polls p
          where p.id = poll_options.poll_id
            and p.created_by = auth.uid()
        )
      );
  end if;

  -- Update by poll owner
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'poll_options' and policyname = 'Options update by poll owner'
  ) then
    create policy "Options update by poll owner"
      on public.poll_options
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.polls p
          where p.id = poll_options.poll_id
            and p.created_by = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.polls p
          where p.id = poll_options.poll_id
            and p.created_by = auth.uid()
        )
      );
  end if;

  -- Delete by poll owner
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'poll_options' and policyname = 'Options delete by poll owner'
  ) then
    create policy "Options delete by poll owner"
      on public.poll_options
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.polls p
          where p.id = poll_options.poll_id
            and p.created_by = auth.uid()
        )
      );
  end if;
end $$;

-- Votes policies
do $$ begin
  -- Read for everyone
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'votes' and policyname = 'Votes allow read to all'
  ) then
    create policy "Votes allow read to all"
      on public.votes
      for select
      using (true);
  end if;

  -- Insert by authenticated users: must set voter_id = auth.uid()
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'votes' and policyname = 'Votes insert by authenticated'
  ) then
    create policy "Votes insert by authenticated"
      on public.votes
      for insert
      to authenticated
      with check (voter_id = auth.uid());
  end if;

  -- Insert by anonymous users: voter_id must be null
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'votes' and policyname = 'Votes insert by anon'
  ) then
    create policy "Votes insert by anon"
      on public.votes
      for insert
      to anon
      with check (voter_id is null);
  end if;

  -- No update/delete policies => not allowed
end $$;

--
-- Helper view for option vote counts
--
create or replace view public.poll_option_vote_counts as
select
  o.id       as option_id,
  o.poll_id  as poll_id,
  count(v.id) as vote_count
from public.poll_options o
left join public.votes v on v.option_id = o.id
group by o.id, o.poll_id;

comment on view public.poll_option_vote_counts is 'Aggregated vote counts per option';
