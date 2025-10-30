-- Create table for ticket likes
create table if not exists public.ticket_likes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Unique like per user per ticket
create unique index if not exists idx_ticket_likes_unique on public.ticket_likes (ticket_id, user_id);

-- Helpful indexes
create index if not exists idx_ticket_likes_ticket on public.ticket_likes (ticket_id);
create index if not exists idx_ticket_likes_user on public.ticket_likes (user_id);

-- RLS policies (optional: allow authenticated users to like/unlike their own)
alter table public.ticket_likes enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ticket_likes' and policyname = 'Allow read for all authenticated'
  ) then
    create policy "Allow read for all authenticated" on public.ticket_likes
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ticket_likes' and policyname = 'Allow insert own like'
  ) then
    create policy "Allow insert own like" on public.ticket_likes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ticket_likes' and policyname = 'Allow delete own like'
  ) then
    create policy "Allow delete own like" on public.ticket_likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;


