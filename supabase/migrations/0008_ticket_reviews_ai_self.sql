-- Allow ticket creators to insert an AI-generated self-review for their own ticket

-- Policy: creator can insert when metadata.ai_generated = true and reviewer_id = auth.uid()
drop policy if exists "Allow AI self-review by ticket creator" on public.ticket_reviews;
create policy "Allow AI self-review by ticket creator"
on public.ticket_reviews
for insert
to authenticated
with check (
  exists (
    select 1 from public.tickets t
    where t.id = ticket_reviews.ticket_id
      and t.creator_id = auth.uid()
  )
  and reviewer_id = auth.uid()
  and coalesce((ticket_reviews.metadata ->> 'ai_generated')::boolean, false) = true
);


