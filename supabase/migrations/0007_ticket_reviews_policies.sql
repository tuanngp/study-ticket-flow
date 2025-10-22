-- Enable RLS and add policies for ticket_reviews

alter table public.ticket_reviews enable row level security;

-- Allow authenticated users to read reviews
drop policy if exists "Allow read for authenticated" on public.ticket_reviews;
create policy "Allow read for authenticated"
on public.ticket_reviews
for select
to authenticated
using (true);

-- Allow instructors/admins to insert exactly one review per ticket
drop policy if exists "Allow insert for instructors and admins" on public.ticket_reviews;
create policy "Allow insert for instructors and admins"
on public.ticket_reviews
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('instructor','admin')
  )
  and not exists (
    select 1 from public.ticket_reviews tr
    where tr.ticket_id = ticket_reviews.ticket_id
      and tr.reviewer_id = auth.uid()
  )
  and reviewer_id = auth.uid()
);

-- Allow reviewers to update their own reviews
drop policy if exists "Allow update own review" on public.ticket_reviews;
create policy "Allow update own review"
on public.ticket_reviews
for update
to authenticated
using (reviewer_id = auth.uid())
with check (reviewer_id = auth.uid());


