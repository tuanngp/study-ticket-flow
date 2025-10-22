-- ticket_reviews table for instructor/admin reviews on tickets
create table if not exists public.ticket_reviews (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'completed', -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  overall_rating integer not null check (overall_rating between 1 and 5),
  quality_rating integer check (quality_rating between 1 and 5),
  completeness_rating integer check (completeness_rating between 1 and 5),
  clarity_rating integer check (clarity_rating between 1 and 5),
  helpfulness_rating integer check (helpfulness_rating between 1 and 5),
  feedback text,
  suggestions text,
  is_anonymous boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(ticket_id, reviewer_id)
);

-- Helpful indexes
create index if not exists idx_ticket_reviews_ticket_id on public.ticket_reviews(ticket_id);
create index if not exists idx_ticket_reviews_reviewer_id on public.ticket_reviews(reviewer_id);
create index if not exists idx_ticket_reviews_created_at on public.ticket_reviews(created_at desc);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ticket_reviews_updated_at on public.ticket_reviews;
create trigger trg_ticket_reviews_updated_at
before update on public.ticket_reviews
for each row execute function public.set_updated_at();


