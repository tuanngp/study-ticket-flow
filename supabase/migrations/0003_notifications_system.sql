-- Notification System Migration
-- Create comprehensive notification system for EduTicket AI

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'ticket_created',
  'ticket_assigned',
  'ticket_status_changed',
  'ticket_resolved',
  'ticket_due_soon',
  'comment_added',
  'mention',
  'ai_triage_complete',
  'assignment_failed',
  'deadline_warning',
  'similar_ticket_found',
  'weekly_report',
  'trend_alert',
  'workload_high',
  'sla_breach'
);

-- Create notification priority enum
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  
  -- Related entities
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status tracking
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery tracking
  delivered_channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  
  -- Actions for notification
  actions JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_ticket_id ON notifications(ticket_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Create composite index for common queries
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Create notification preferences table (future-ready)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  channels TEXT[] DEFAULT ARRAY['in_app', 'email']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one preference per user per type
  UNIQUE(user_id, notification_type)
);

-- Create index for preferences lookup
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for notification_preferences
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create helper function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Stores all user notifications for ticket events, comments, and system alerts';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery (future use)';
COMMENT ON COLUMN notifications.metadata IS 'Additional context data stored as JSON (e.g., educational context, ticket details)';
COMMENT ON COLUMN notifications.actions IS 'Array of action objects with label and url for notification CTAs';
COMMENT ON COLUMN notifications.delivered_channels IS 'Array of channels where notification was delivered (in_app, email, discord)';

-- ============================================
-- REAL-TIME CONFIGURATION
-- ============================================

-- Enable real-time for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add notification to realtime publication
-- Note: This requires the 'supabase_realtime' publication to exist
-- If using Supabase, this is created automatically
-- For self-hosted, you may need to create it first:
-- CREATE PUBLICATION supabase_realtime;

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Add comment about real-time
COMMENT ON TABLE notifications IS 'Stores all user notifications for ticket events, comments, and system alerts. Real-time enabled for instant updates.';

