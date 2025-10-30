-- Add views_count column to tickets
alter table public.tickets
  add column if not exists views_count integer not null default 0;

create index if not exists idx_tickets_views_count on public.tickets (views_count);

-- Atomic increment function
create or replace function public.increment_ticket_views(p_ticket_id uuid)
returns void
language sql
security definer
as $$
  update public.tickets
  set views_count = coalesce(views_count, 0) + 1,
      updated_at = now()
  where id = p_ticket_id;
$$;

grant execute on function public.increment_ticket_views(uuid) to authenticated;

-- Compatibility function name used elsewhere in codebases
create or replace function public.increment_view_count(ticket_id uuid)
returns void
language sql
security definer
as $$
  update public.tickets
  set views_count = coalesce(views_count, 0) + 1,
      updated_at = now()
  where id = increment_view_count.ticket_id;
$$;

grant execute on function public.increment_view_count(uuid) to authenticated;

