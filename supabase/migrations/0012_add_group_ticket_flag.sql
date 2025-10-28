-- Add is_group_ticket flag to tickets table
-- This will help efficiently filter group tickets from regular tickets

-- Add the flag column
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_group_ticket BOOLEAN DEFAULT false;

-- Add comment to document the new field
COMMENT ON COLUMN tickets.is_group_ticket IS 'Flag to indicate if this ticket belongs to a group (true) or is a regular ticket (false)';

-- Create index for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_tickets_is_group_ticket ON tickets(is_group_ticket);

-- Update existing group tickets to have the flag set
UPDATE tickets 
SET is_group_ticket = true 
WHERE id IN (SELECT ticket_id FROM group_tickets);

-- Create a trigger to automatically set the flag when group tickets are created
CREATE OR REPLACE FUNCTION set_group_ticket_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- When a group_ticket is created, mark the corresponding ticket as group ticket
  UPDATE tickets 
  SET is_group_ticket = true 
  WHERE id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for group_tickets insert
DROP TRIGGER IF EXISTS trigger_set_group_ticket_flag ON group_tickets;
CREATE TRIGGER trigger_set_group_ticket_flag
  AFTER INSERT ON group_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_group_ticket_flag();

-- Create trigger for group_tickets delete (optional - to unset flag when group ticket is deleted)
CREATE OR REPLACE FUNCTION unset_group_ticket_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- When a group_ticket is deleted, check if there are other group tickets for this ticket
  -- If not, unmark the ticket as group ticket
  IF NOT EXISTS (SELECT 1 FROM group_tickets WHERE ticket_id = OLD.ticket_id) THEN
    UPDATE tickets 
    SET is_group_ticket = false 
    WHERE id = OLD.ticket_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_unset_group_ticket_flag ON group_tickets;
CREATE TRIGGER trigger_unset_group_ticket_flag
  AFTER DELETE ON group_tickets
  FOR EACH ROW
  EXECUTE FUNCTION unset_group_ticket_flag();
