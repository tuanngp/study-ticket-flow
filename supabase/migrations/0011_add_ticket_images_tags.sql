-- Add images and tags fields to tickets table
ALTER TABLE tickets 
ADD COLUMN images text[] DEFAULT '{}',
ADD COLUMN tags text[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX idx_tickets_images ON tickets USING GIN (images);
CREATE INDEX idx_tickets_tags ON tickets USING GIN (tags);
