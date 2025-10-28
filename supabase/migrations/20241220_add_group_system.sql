-- Migration: Add Group System for Student Collaboration
-- Date: 2024-12-20
-- Description: Extends EduTicket AI with comprehensive group collaboration features

-- 1. Extend user roles to include lead and manager
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

-- 2. Add group-related enums
CREATE TYPE group_role AS ENUM (
  'instructor',    -- Giáo viên - quyền cao nhất
  'class_leader',  -- Lớp trưởng - hỗ trợ giáo viên
  'group_leader',  -- Trưởng nhóm - quản lý nhóm con
  'member'         -- Thành viên - tham gia học tập
);

CREATE TYPE group_status AS ENUM (
  'active',
  'inactive',
  'archived',
  'pending_approval'
);

CREATE TYPE group_ticket_type AS ENUM (
  'group_collaborative',  -- Ticket cả nhóm cùng làm
  'individual_support',   -- Ticket cá nhân nhưng nhóm hỗ trợ
  'teacher_request',      -- Gửi đơn xin phép giáo viên
  'group_discussion'      -- Thảo luận nhóm
);

CREATE TYPE group_event_type AS ENUM (
  'study_session',        -- Buổi học nhóm
  'assignment_deadline',   -- Deadline bài tập
  'exam_schedule',         -- Lịch thi
  'group_meeting',         -- Họp nhóm
  'teacher_office_hours',  -- Giờ làm việc của giáo viên
  'project_presentation'   -- Thuyết trình dự án
);

CREATE TYPE grade_type AS ENUM (
  'group_project',         -- Điểm dự án nhóm
  'individual_contribution', -- Đóng góp cá nhân
  'peer_review',          -- Đánh giá đồng nghiệp
  'attendance',           -- Điểm chuyên cần
  'participation',        -- Điểm tham gia
  'quiz',                 -- Điểm quiz
  'assignment'            -- Điểm bài tập
);

-- 3. Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Educational context
  course_code TEXT NOT NULL,
  class_name TEXT,
  semester TEXT NOT NULL, -- "2024A", "2024B", etc.
  
  -- Group settings
  max_members INTEGER NOT NULL DEFAULT 100,
  is_public BOOLEAN NOT NULL DEFAULT true,
  allow_self_join BOOLEAN NOT NULL DEFAULT true,
  
  -- Status and metadata
  status group_status NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT groups_max_members_check CHECK (max_members > 0 AND max_members <= 100),
  CONSTRAINT groups_name_length_check CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 100)
);

-- 4. Create group_members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role group_role NOT NULL DEFAULT 'member',
  
  -- Status and timestamps
  status group_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  -- Invitation system
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(group_id, user_id),
  CONSTRAINT group_members_role_check CHECK (
    (role = 'instructor' AND status = 'active') OR 
    (role != 'instructor')
  )
);

-- 5. Create group_tickets table (extends existing tickets)
CREATE TABLE group_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  -- Group-specific ticket properties
  ticket_type group_ticket_type NOT NULL DEFAULT 'individual_support',
  is_shared BOOLEAN NOT NULL DEFAULT false, -- Can other members see this ticket?
  requires_teacher_approval BOOLEAN NOT NULL DEFAULT false,
  
  -- Collaboration metadata
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to_group BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(group_id, ticket_id)
);

-- 6. Create group_events table (extends existing calendar_events)
CREATE TABLE group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Group-specific event properties
  event_type group_event_type NOT NULL DEFAULT 'study_session',
  requires_attendance BOOLEAN NOT NULL DEFAULT false,
  max_participants INTEGER,
  
  -- Created by
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(group_id, event_id),
  CONSTRAINT group_events_max_participants_check CHECK (max_participants IS NULL OR max_participants > 0)
);

-- 7. Create group_event_attendance table
CREATE TABLE group_event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_event_id UUID NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Attendance status
  status TEXT NOT NULL DEFAULT 'pending', -- 'attending', 'not_attending', 'pending', 'excused'
  reason TEXT, -- Reason for not attending
  
  -- Timestamps
  responded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(group_event_id, user_id),
  CONSTRAINT group_event_attendance_status_check CHECK (status IN ('attending', 'not_attending', 'pending', 'excused'))
);

-- 8. Create group_grades table
CREATE TABLE group_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Grade information
  grade_type grade_type NOT NULL,
  score DECIMAL(5,2) NOT NULL, -- Score out of 100
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  
  -- Grading metadata
  graded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feedback TEXT,
  rubric_data JSONB DEFAULT '{}',
  
  -- Related entities
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  -- Timestamps
  graded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT group_grades_score_check CHECK (score >= 0 AND score <= max_score),
  CONSTRAINT group_grades_max_score_check CHECK (max_score > 0)
);

-- 9. Create group_chat_messages table
CREATE TABLE group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'file', 'image', 'system'
  
  -- File attachments
  attachments JSONB DEFAULT '[]',
  
  -- Message metadata
  reply_to UUID REFERENCES group_chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT group_chat_messages_content_check CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
  CONSTRAINT group_chat_messages_type_check CHECK (message_type IN ('text', 'file', 'image', 'system'))
);

-- 10. Create group_ai_sessions table (extends existing chat_sessions)
CREATE TABLE group_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  
  -- Session metadata
  session_name TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT true, -- Can all group members access this session?
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(group_id, session_id)
);

-- 11. Create indexes for performance
CREATE INDEX idx_groups_course_code ON groups(course_code);
CREATE INDEX idx_groups_semester ON groups(semester);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_instructor_id ON groups(instructor_id);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);
CREATE INDEX idx_group_members_status ON group_members(status);

CREATE INDEX idx_group_tickets_group_id ON group_tickets(group_id);
CREATE INDEX idx_group_tickets_ticket_id ON group_tickets(ticket_id);
CREATE INDEX idx_group_tickets_type ON group_tickets(ticket_type);
CREATE INDEX idx_group_tickets_created_by ON group_tickets(created_by);

CREATE INDEX idx_group_events_group_id ON group_events(group_id);
CREATE INDEX idx_group_events_event_id ON group_events(event_id);
CREATE INDEX idx_group_events_type ON group_events(event_type);
CREATE INDEX idx_group_events_created_by ON group_events(created_by);

CREATE INDEX idx_group_event_attendance_event_id ON group_event_attendance(group_event_id);
CREATE INDEX idx_group_event_attendance_user_id ON group_event_attendance(user_id);
CREATE INDEX idx_group_event_attendance_status ON group_event_attendance(status);

CREATE INDEX idx_group_grades_group_id ON group_grades(group_id);
CREATE INDEX idx_group_grades_user_id ON group_grades(user_id);
CREATE INDEX idx_group_grades_type ON group_grades(grade_type);
CREATE INDEX idx_group_grades_graded_by ON group_grades(graded_by);

CREATE INDEX idx_group_chat_messages_group_id ON group_chat_messages(group_id);
CREATE INDEX idx_group_chat_messages_user_id ON group_chat_messages(user_id);
CREATE INDEX idx_group_chat_messages_created_at ON group_chat_messages(created_at);

CREATE INDEX idx_group_ai_sessions_group_id ON group_ai_sessions(group_id);
CREATE INDEX idx_group_ai_sessions_session_id ON group_ai_sessions(session_id);

-- 12. Create RLS (Row Level Security) policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_ai_sessions ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Groups are viewable by members and instructors" ON groups
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = groups.id AND status = 'active'
    ) OR 
    auth.uid() = instructor_id OR
    auth.uid() = created_by
  );

CREATE POLICY "Groups can be created by instructors and admins" ON groups
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Groups can be updated by instructors and group creators" ON groups
  FOR UPDATE USING (
    auth.uid() = instructor_id OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Group members policies
CREATE POLICY "Group members are viewable by group members" ON group_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM group_members gm2 
      WHERE gm2.group_id = group_members.group_id AND gm2.status = 'active'
    )
  );

CREATE POLICY "Group members can be managed by instructors and group leaders" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('instructor', 'group_leader')
      AND gm.status = 'active'
    ) OR
    EXISTS (
      SELECT 1 FROM groups g 
      WHERE g.id = group_members.group_id 
      AND (g.instructor_id = auth.uid() OR g.created_by = auth.uid())
    )
  );

-- Group tickets policies
CREATE POLICY "Group tickets are viewable by group members" ON group_tickets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_tickets.group_id AND status = 'active'
    )
  );

CREATE POLICY "Group tickets can be created by group members" ON group_tickets
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_tickets.group_id AND status = 'active'
    )
  );

-- Group events policies
CREATE POLICY "Group events are viewable by group members" ON group_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_events.group_id AND status = 'active'
    )
  );

CREATE POLICY "Group events can be created by instructors and group leaders" ON group_events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_events.group_id 
      AND user_id = auth.uid() 
      AND role IN ('instructor', 'group_leader')
      AND status = 'active'
    )
  );

-- Group grades policies
CREATE POLICY "Group grades are viewable by students and instructors" ON group_grades
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = graded_by OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_grades.group_id 
      AND user_id = auth.uid() 
      AND role IN ('instructor', 'class_leader')
      AND status = 'active'
    )
  );

CREATE POLICY "Group grades can be created by instructors" ON group_grades
  FOR INSERT WITH CHECK (
    auth.uid() = graded_by AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_grades.group_id 
      AND user_id = auth.uid() 
      AND role = 'instructor'
      AND status = 'active'
    )
  );

-- Group chat messages policies
CREATE POLICY "Group chat messages are viewable by group members" ON group_chat_messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_chat_messages.group_id AND status = 'active'
    )
  );

CREATE POLICY "Group chat messages can be created by group members" ON group_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_chat_messages.group_id AND status = 'active'
    )
  );

-- Group AI sessions policies
CREATE POLICY "Group AI sessions are viewable by group members" ON group_ai_sessions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_ai_sessions.group_id AND status = 'active'
    )
  );

CREATE POLICY "Group AI sessions can be created by group members" ON group_ai_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = group_ai_sessions.group_id AND status = 'active'
    )
  );

-- 13. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_tickets_updated_at BEFORE UPDATE ON group_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_events_updated_at BEFORE UPDATE ON group_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_grades_updated_at BEFORE UPDATE ON group_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_chat_messages_updated_at BEFORE UPDATE ON group_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_ai_sessions_updated_at BEFORE UPDATE ON group_ai_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Create functions for group management
CREATE OR REPLACE FUNCTION get_group_member_count(group_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM group_members 
    WHERE group_id = group_uuid AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_user_join_group(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  group_record RECORD;
  member_count INTEGER;
BEGIN
  -- Get group information
  SELECT * INTO group_record FROM groups WHERE id = group_uuid;
  
  -- Check if group exists and is active
  IF NOT FOUND OR group_record.status != 'active' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_uuid AND user_id = user_uuid
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if group allows self-join
  IF NOT group_record.allow_self_join THEN
    RETURN FALSE;
  END IF;
  
  -- Check member limit
  member_count := get_group_member_count(group_uuid);
  IF member_count >= group_record.max_members THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 15. Add comments for documentation
COMMENT ON TABLE groups IS 'Groups for student collaboration within courses';
COMMENT ON TABLE group_members IS 'Membership and roles within groups';
COMMENT ON TABLE group_tickets IS 'Tickets associated with groups for collaborative work';
COMMENT ON TABLE group_events IS 'Calendar events specific to groups';
COMMENT ON TABLE group_event_attendance IS 'Attendance tracking for group events';
COMMENT ON TABLE group_grades IS 'Grading system for group activities';
COMMENT ON TABLE group_chat_messages IS 'Real-time chat messages within groups';
COMMENT ON TABLE group_ai_sessions IS 'AI assistant sessions shared within groups';

COMMENT ON COLUMN groups.max_members IS 'Maximum number of members allowed in the group (1-100)';
COMMENT ON COLUMN groups.is_public IS 'Whether the group is visible to all students in the course';
COMMENT ON COLUMN groups.allow_self_join IS 'Whether students can join the group without invitation';

COMMENT ON COLUMN group_members.role IS 'Role within the group: instructor, class_leader, group_leader, or member';
COMMENT ON COLUMN group_tickets.ticket_type IS 'Type of group ticket: collaborative, individual_support, teacher_request, or discussion';
COMMENT ON COLUMN group_events.event_type IS 'Type of group event: study_session, assignment_deadline, exam_schedule, etc.';
COMMENT ON COLUMN group_grades.grade_type IS 'Type of grade: group_project, individual_contribution, peer_review, etc.';
