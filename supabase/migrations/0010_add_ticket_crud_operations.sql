-- Add 'deleted' status to ticket_status enum
ALTER TYPE ticket_status ADD VALUE 'deleted';

-- Add new notification types for ticket updates and deletions
ALTER TYPE notification_type ADD VALUE 'ticket_updated';
ALTER TYPE notification_type ADD VALUE 'ticket_deleted';

-- Add indexes for better performance on ticket operations
CREATE INDEX IF NOT EXISTS idx_tickets_creator_id ON public.tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON public.tickets(updated_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create trigger for tickets table
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add RLS policies for ticket operations
-- Allow users to update their own tickets or tickets assigned to them
CREATE POLICY "Users can update their own tickets or assigned tickets" ON public.tickets
  FOR UPDATE USING (
    auth.uid() = creator_id OR 
    auth.uid() = assignee_id
  );

-- Allow users to delete their own tickets (soft delete)
CREATE POLICY "Users can delete their own tickets" ON public.tickets
  FOR UPDATE USING (
    auth.uid() = creator_id AND 
    status IN ('open', 'in_progress')
  );

-- Add notification content formatting for new notification types
-- This would typically be handled in the application layer,
-- but we can add some helper functions if needed

-- Add function to check if user can update ticket
CREATE OR REPLACE FUNCTION public.can_update_ticket(ticket_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id 
    AND (creator_id = user_id OR assignee_id = user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check if user can delete ticket
CREATE OR REPLACE FUNCTION public.can_delete_ticket(ticket_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id 
    AND creator_id = user_id
    AND status IN ('open', 'in_progress')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
