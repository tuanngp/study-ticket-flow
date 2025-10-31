import { supabase } from '@/integrations/supabase/client';
import { 
  type Group,
  type NewGroup,
  type GroupMember,
  type NewGroupMember,
  type GroupTicket,
  type NewGroupTicket,
  type GroupEvent,
  type NewGroupEvent,
  type GroupEventAttendance,
  type NewGroupEventAttendance,
  type GroupGrade,
  type NewGroupGrade,
  type GroupChatMessage,
  type NewGroupChatMessage,
  type GroupAiSession,
  type NewGroupAiSession
} from '@/db/schema';

// Types for group system
export type GroupRole = 'instructor' | 'class_leader' | 'group_leader' | 'member';
export type GroupStatus = 'active' | 'inactive' | 'archived' | 'pending_approval';
export type GroupTicketType = 'group_collaborative' | 'individual_support' | 'teacher_request' | 'group_discussion';
export type GroupEventType = 'study_session' | 'assignment_deadline' | 'exam_schedule' | 'group_meeting' | 'teacher_office_hours' | 'project_presentation';
export type GradeType = 'group_project' | 'individual_contribution' | 'peer_review' | 'attendance' | 'participation' | 'quiz' | 'assignment';

export interface CreateGroupData {
  name: string;
  description?: string;
  courseCode: string;
  className?: string;
  semester: string;
  maxMembers?: number;
  isPublic?: boolean;
  allowSelfJoin?: boolean;
  instructorId?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
  allowSelfJoin?: boolean;
  status?: GroupStatus;
  instructorId?: string;
}

export interface GroupWithDetails extends Group {
  memberCount: number;
  instructor?: {
    id: string;
    fullName: string | null;
    email: string;
  };
  creator?: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

export interface GroupMemberWithDetails extends GroupMember {
  user: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export interface GroupTicketWithDetails extends GroupTicket {
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    type: string;
    createdAt: Date;
  };
  creator: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

export interface GroupEventWithDetails extends GroupEvent {
  event: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    location: string | null;
  };
  attendanceCount: number;
  maxParticipants?: number;
}

export interface GroupGradeWithDetails extends GroupGrade {
  user: {
    id: string;
    fullName: string | null;
    email: string;
  };
  gradedBy: {
    id: string;
    fullName: string | null;
    email: string;
  };
}

export interface GroupChatMessageWithDetails extends GroupChatMessage {
  user: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    user: {
      fullName: string | null;
    };
  };
}

/**
 * GroupService - Core service for group management
 */
export class GroupService {
  /**
   * Create a new group
   */
  static async createGroup(data: CreateGroupData, creatorId: string): Promise<Group> {
    try {

      const groupData = {
        name: data.name,
        description: data.description,
        course_code: data.courseCode,
        class_name: data.className,
        semester: data.semester,
        max_members: data.maxMembers || 100,
        is_public: data.isPublic ?? true,
        allow_self_join: data.allowSelfJoin ?? true,
        created_by: creatorId,
        instructor_id: data.instructorId || creatorId, // Set creator as instructor if no instructorId provided
        status: 'active'
      };

      const { data: group, error } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add creator as instructor or group leader
      const creatorRole: GroupRole = data.instructorId ? 'group_leader' : 'instructor';
      await this.addMember(group.id, creatorId, creatorRole);

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  /**
   * Get group by ID with details
   */
  static async getGroupById(groupId: string): Promise<GroupWithDetails | null> {
    try {
      // Get group data
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) {
        throw groupError;
      }

      if (!group) {
        return null;
      }

      // Get member count
      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (countError) {
        throw countError;
      }

      // Get instructor info
      let instructor = null;
      if (group.instructor_id) {
        const { data: instructorData, error: instructorError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', group.instructor_id)
          .single();
        
        if (instructorError) {
          console.error('Error fetching instructor:', instructorError);
          // Don't throw error, just log it and continue without instructor
        } else {
          instructor = instructorData;
        }
      } else {
        
        // Auto-set creator as instructor if no instructor is set
        if (group.created_by) {
          try {
            await this.setInstructorForGroup(groupId, group.created_by);
            // Re-fetch instructor data
            const { data: instructorData } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('id', group.created_by)
              .single();
            instructor = instructorData;
            console.log('Auto-set instructor:', instructor);
          } catch (error) {
            console.error('Error auto-setting instructor:', error);
          }
        }
      }

      // Get creator info
      let creator = null;
      if (group.created_by) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', group.created_by)
          .single();
        creator = creatorData;
      }

      return {
        ...group,
        // Map snake_case to camelCase for frontend compatibility
        maxMembers: group.max_members,
        isPublic: group.is_public,
        allowSelfJoin: group.allow_self_join,
        courseCode: group.course_code,
        className: group.class_name,
        createdBy: group.created_by,
        instructorId: group.instructor_id,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        memberCount: memberCounts?.length || 0,
        instructor,
        creator,
      };
    } catch (error) {
      console.error('Error getting group:', error);
      throw new Error('Failed to get group');
    }
  }

  /**
   * Get all public groups (for discovery by all students)
   */
  static async getPublicGroups(): Promise<GroupWithDetails[]> {
    try {
      // Get all public groups
      const { data: publicGroups, error: publicError } = await supabase
        .from('groups')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'active');

      if (publicError) {
        throw publicError;
      }

      if (!publicGroups || publicGroups.length === 0) {
        return [];
      }

      // Get member counts for all groups
      const groupIds = publicGroups.map(g => g.id);
      
      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('status', 'active');

      if (countError) {
        throw countError;
      }

      // Count members per group
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.group_id] = (acc[member.group_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get instructor and creator info
      const instructorIds = publicGroups.map(g => g.instructor_id).filter(Boolean);
      const creatorIds = publicGroups.map(g => g.created_by).filter(Boolean);
      
      const allUserIds = [...new Set([...instructorIds, ...creatorIds])];

      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', allUserIds);

      // Format results
      const formattedGroups: GroupWithDetails[] = publicGroups.map(group => ({
        ...group,
        maxMembers: group.max_members,
        isPublic: group.is_public,
        allowSelfJoin: group.allow_self_join,
        courseCode: group.course_code,
        className: group.class_name,
        createdBy: group.created_by,
        instructorId: group.instructor_id,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        memberCount: memberCountMap[group.id] || 0,
        instructor: users?.find(u => u.id === group.instructor_id) || null,
        creator: users?.find(u => u.id === group.created_by) || null,
      }));

      return formattedGroups;
    } catch (error) {
      console.error('Error getting public groups:', error);
      throw new Error('Failed to get public groups');
    }
  }

  /**
   * Get groups for a user (groups they belong to or created, plus all public groups)
   */
  static async getUserGroups(userId: string): Promise<GroupWithDetails[]> {
    try {
      // Get groups created by user
      const { data: createdGroups, error: createdError } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', userId);

      if (createdError) {
        throw createdError;
      }

      // Get groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group:groups(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (memberError) {
        throw memberError;
      }

      // Get member counts for all groups
      const allGroupIds = [
        ...(createdGroups?.map(g => g.id) || []),
        ...(memberGroups?.map(m => m.group?.id).filter(Boolean) || [])
      ];

      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', allGroupIds)
        .eq('status', 'active');

      if (countError) {
        throw countError;
      }

      // Count members per group
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.group_id] = (acc[member.group_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get instructor and creator info for all groups
      const allGroups = [
        ...(createdGroups || []),
        ...(memberGroups?.map(m => m.group).filter(Boolean) || [])
      ];

      const uniqueGroupIds = [...new Set(allGroups.map(g => g.id))];
      
      // Get instructor info
      const instructorIds = uniqueGroupIds.map(id => 
        allGroups.find(g => g.id === id)?.instructor_id
      ).filter(Boolean);

      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', instructorIds);

      // Get creator info
      const creatorIds = uniqueGroupIds.map(id => 
        allGroups.find(g => g.id === id)?.created_by
      ).filter(Boolean);

      const { data: creators } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', creatorIds);

      // Combine and format results
      const uniqueGroups = allGroups.reduce((acc, group) => {
        if (!acc.find(g => g.id === group.id)) {
          acc.push({
            ...group,
            // Map snake_case to camelCase for frontend compatibility
            maxMembers: group.max_members,
            isPublic: group.is_public,
            allowSelfJoin: group.allow_self_join,
            courseCode: group.course_code,
            className: group.class_name,
            createdBy: group.created_by,
            instructorId: group.instructor_id,
            createdAt: group.created_at,
            updatedAt: group.updated_at,
            memberCount: memberCountMap[group.id] || 0,
            instructor: instructors?.find(i => i.id === group.instructor_id) || null,
            creator: creators?.find(c => c.id === group.created_by) || null,
          });
        }
        return acc;
      }, [] as GroupWithDetails[]);

      return uniqueGroups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw new Error('Failed to get user groups');
    }
  }

  /**
   * Get groups by course code
   */
  static async getGroupsByCourse(courseCode: string, semester?: string): Promise<GroupWithDetails[]> {
    try {
      let whereCondition = eq(groups.courseCode, courseCode);
      if (semester) {
        whereCondition = and(whereCondition, eq(groups.semester, semester));
      }

      const result = await db
        .select({
          group: groups,
          memberCount: count(groupMembers.id),
          instructor: {
            id: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
          },
          creator: {
            id: profiles.id,
            fullName: profiles.fullName,
            email: profiles.email,
          }
        })
        .from(groups)
        .leftJoin(groupMembers, eq(groupMembers.groupId, groups.id))
        .leftJoin(profiles, eq(profiles.id, groups.instructorId))
        .leftJoin(profiles, eq(profiles.id, groups.createdBy))
        .where(and(whereCondition, eq(groups.status, 'active')))
        .groupBy(groups.id, profiles.id)
        .orderBy(desc(groups.createdAt));

      return result.map(({ group, memberCount, instructor, creator }) => ({
        ...group,
        memberCount: Number(memberCount),
        instructor,
        creator
      }));
    } catch (error) {
      console.error('Error getting groups by course:', error);
      throw new Error('Failed to get groups by course');
    }
  }

  /**
   * Set instructor for a group (if not already set)
   */
  static async setInstructorForGroup(groupId: string, instructorId: string): Promise<boolean> {
    try {
      // Check if group already has instructor
      const { data: group } = await supabase
        .from('groups')
        .select('instructor_id')
        .eq('id', groupId)
        .single();

      if (group?.instructor_id) {
        console.log('Group already has instructor:', group.instructor_id);
        return false;
      }

      // Set instructor
      const { error } = await supabase
        .from('groups')
        .update({ instructor_id: instructorId })
        .eq('id', groupId);

      if (error) {
        throw error;
      }

      console.log('Instructor set for group:', groupId, 'instructor:', instructorId);
      return true;
    } catch (error) {
      console.error('Error setting instructor for group:', error);
      throw new Error('Failed to set instructor for group');
    }
  }

  /**
   * Update group
   */
  static async updateGroup(groupId: string, data: UpdateGroupData, userId: string): Promise<Group> {
    try {
      // Check permissions
      const group = await this.getGroupById(groupId);
      if (!group) throw new Error('Group not found');

      const canUpdate = 
        group.createdBy === userId || 
        group.instructorId === userId ||
        await this.hasRoleInGroup(groupId, userId, ['instructor', 'group_leader']);

      if (!canUpdate) {
        throw new Error('Insufficient permissions to update group');
      }

      const updateData = {
        name: data.name,
        description: data.description,
        max_members: data.maxMembers,
        is_public: data.isPublic,
        allow_self_join: data.allowSelfJoin,
        updated_at: new Date().toISOString()
      };

      const { data: updatedGroup, error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Group updated successfully:', updatedGroup);
      return updatedGroup;
    } catch (error) {
      console.error('Error updating group:', error);
      throw new Error('Failed to update group');
    }
  }

  /**
   * Delete group
   */
  static async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const group = await this.getGroupById(groupId);
      if (!group) throw new Error('Group not found');

      const canDelete = group.createdBy === userId || group.instructorId === userId;
      if (!canDelete) {
        throw new Error('Insufficient permissions to delete group');
      }

      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  /**
   * Add member to group
   */
  static async addMember(groupId: string, userId: string, role: GroupRole = 'member'): Promise<GroupMember> {
    try {
      const memberData = {
        group_id: groupId,
        user_id: userId,
        role,
        status: 'active',
        joined_at: new Date().toISOString()
      };

      const { data: member, error } = await supabase
        .from('group_members')
        .insert(memberData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return member;
    } catch (error) {
      console.error('Error adding member:', error);
      throw new Error('Failed to add member');
    }
  }

  /**
   * Remove member from group
   */
  static async removeMember(groupId: string, userId: string, removedBy: string): Promise<boolean> {
    try {
      // Check permissions
      const canRemove = await this.hasRoleInGroup(groupId, removedBy, ['instructor', 'group_leader']);
      if (!canRemove) {
        throw new Error('Insufficient permissions to remove member');
      }

      await db
        .update(groupMembers)
        .set({
          status: 'inactive',
          leftAt: new Date()
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member');
    }
  }

  /**
   * Get group members with details
   */
  static async getGroupMembers(groupId: string): Promise<GroupMemberWithDetails[]> {
    try {
      const { data: members, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email, avatar_url)
        `)
        .eq('group_id', groupId)
        .eq('status', 'active')
        .order('role', { ascending: true });

      if (error) {
        throw error;
      }

      return members?.map(member => ({
        ...member,
        user: member.user
      })) || [];
    } catch (error) {
      console.error('Error getting group members:', error);
      throw new Error('Failed to get group members');
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(groupId: string, userId: string, newRole: GroupRole, updatedBy: string): Promise<GroupMember> {
    try {
      // Check permissions
      const canUpdate = await this.hasRoleInGroup(groupId, updatedBy, ['instructor', 'group_leader']);
      if (!canUpdate) {
        throw new Error('Insufficient permissions to update member role');
      }

      const [updatedMember] = await db
        .update(groupMembers)
        .set({ role: newRole })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
        .returning();

      return updatedMember;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new Error('Failed to update member role');
    }
  }

  /**
   * Check if user has specific role in group
   */
  static async hasRoleInGroup(groupId: string, userId: string, roles: GroupRole[]): Promise<boolean> {
    try {
      const { data: member, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !member) return false;
      return roles.includes(member.role as GroupRole);
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Check if user is a member of the group
   */
  static async checkUserMembership(groupId: string, userId: string): Promise<boolean> {
    try {
      const { data: member, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !member) return false;
      return true;
    } catch (error) {
      console.error('Error checking user membership:', error);
      return false;
    }
  }

  /**
   * Check if user can join group
   */
  static async canUserJoinGroup(groupId: string, userId: string): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      const group = await this.getGroupById(groupId);
      if (!group) return { canJoin: false, reason: 'Group not found' };

      // Check if user is already a member
      const isMember = await this.hasRoleInGroup(groupId, userId, ['instructor', 'class_leader', 'group_leader', 'member']);
      if (isMember) return { canJoin: false, reason: 'Already a member' };

      // Check if group allows self-join
      if (!group.allowSelfJoin) return { canJoin: false, reason: 'Group requires invitation' };

      // Check member limit
      if (group.memberCount >= group.maxMembers) {
        return { canJoin: false, reason: 'Group is full' };
      }

      return { canJoin: true };
    } catch (error) {
      console.error('Error checking join permission:', error);
      return { canJoin: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Join group
   */
  static async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    try {
      const { canJoin, reason } = await this.canUserJoinGroup(groupId, userId);
      if (!canJoin) {
        throw new Error(reason || 'Cannot join group');
      }

      return await this.addMember(groupId, userId, 'member');
    } catch (error) {
      console.error('Error joining group:', error);
      throw new Error('Failed to join group');
    }
  }

  /**
   * Leave group
   */
  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      await db
        .update(groupMembers)
        .set({
          status: 'inactive',
          leftAt: new Date()
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw new Error('Failed to leave group');
    }
  }
}

/**
 * GroupTicketService - Service for group ticket management
 */
export class GroupTicketService {
  /**
   * Create a group ticket
   */
  static async createGroupTicket(
    groupId: string,
    ticketData: any,
    ticketType: GroupTicketType,
    createdBy: string
  ): Promise<GroupTicket> {
    try {
      // First create the base ticket
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          title: ticketData.title,
          description: ticketData.description,
          type: ticketData.type || 'task',
          priority: ticketData.priority || 'medium',
          creator_id: createdBy,
          course_code: ticketData.courseCode,
          class_name: ticketData.className,
          project_group: ticketData.projectGroup,
          images: ticketData.images || [],
          tags: ticketData.tags || []
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating base ticket:', error);
        throw new Error(`Failed to create base ticket: ${error.message}`);
      }

      // Then create the group ticket association
      const groupTicketData = {
        group_id: groupId,
        ticket_id: ticket.id,
        ticket_type: ticketType,
        is_shared: ticketType === 'group_collaborative' || ticketType === 'group_discussion',
        requires_teacher_approval: ticketType === 'teacher_request',
        created_by: createdBy,
        assigned_to_group: ticketType === 'group_collaborative'
      };

      const { data: groupTicket, error: groupTicketError } = await supabase
        .from('group_tickets')
        .insert(groupTicketData)
        .select()
        .single();

      if (groupTicketError) {
        console.error('Error creating group ticket:', groupTicketError);
        throw new Error(`Failed to create group ticket: ${groupTicketError.message}`);
      }

      return groupTicket;
    } catch (error) {
      console.error('Error creating group ticket:', error);
      throw new Error('Failed to create group ticket');
    }
  }

  /**
   * Get group tickets with details
   */
  static async getGroupTickets(groupId: string, ticketType?: GroupTicketType): Promise<GroupTicketWithDetails[]> {
    try {
      let query = supabase
        .from('group_tickets')
        .select(`
          *,
          ticket:tickets!ticket_id(id, title, description, status, priority, type, created_at),
          creator:profiles!created_by(id, full_name, email)
        `)
        .eq('group_id', groupId);

      if (ticketType) {
        query = query.eq('ticket_type', ticketType);
      }

      const { data: groupTickets, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return groupTickets?.map(groupTicket => ({
        ...groupTicket,
        ticket: groupTicket.ticket,
        creator: groupTicket.creator
      })) || [];
    } catch (error) {
      console.error('Error getting group tickets:', error);
      throw new Error('Failed to get group tickets');
    }
  }

  /**
   * Update group ticket
   */
  static async updateGroupTicket(
    groupTicketId: string,
    updates: Partial<GroupTicket>,
    userId: string
  ): Promise<GroupTicket> {
    try {
      // Check permissions
      const groupTicket = await db
        .select()
        .from(groupTickets)
        .where(eq(groupTickets.id, groupTicketId))
        .limit(1);

      if (groupTicket.length === 0) throw new Error('Group ticket not found');

      const canUpdate = 
        groupTicket[0].createdBy === userId ||
        await GroupService.hasRoleInGroup(groupTicket[0].groupId, userId, ['instructor', 'group_leader']);

      if (!canUpdate) {
        throw new Error('Insufficient permissions to update group ticket');
      }

      const [updatedGroupTicket] = await db
        .update(groupTickets)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(groupTickets.id, groupTicketId))
        .returning();

      return updatedGroupTicket;
    } catch (error) {
      console.error('Error updating group ticket:', error);
      throw new Error('Failed to update group ticket');
    }
  }
}

/**
 * GroupEventService - Service for group event management
 */
export class GroupEventService {
  /**
   * Create a group event
   */
  static async createGroupEvent(
    groupId: string,
    eventData: any,
    eventType: GroupEventType,
    createdBy: string
  ): Promise<GroupEvent> {
    try {
      // First create the base calendar event
      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert({
          ...eventData,
          user_id: createdBy,
          type: 'academic' // Group events are academic type
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Then create the group event association
      const groupEventData = {
        group_id: groupId,
        event_id: event.id,
        event_type: eventType,
        requires_attendance: eventType === 'study_session' || eventType === 'group_meeting',
        max_participants: eventData.maxParticipants,
        created_by: createdBy
      };

      const { data: groupEvent, error: groupEventError } = await supabase
        .from('group_events')
        .insert(groupEventData)
        .select()
        .single();

      if (groupEventError) {
        throw groupEventError;
      }

      return groupEvent;
    } catch (error) {
      console.error('Error creating group event:', error);
      throw new Error('Failed to create group event');
    }
  }

  /**
   * Get group events with details
   */
  static async getGroupEvents(groupId: string, eventType?: GroupEventType): Promise<GroupEventWithDetails[]> {
    try {
      let query = supabase
        .from('group_events')
        .select(`
          *,
          event:calendar_events!event_id(id, title, description, start_date, end_date, location),
          attendance:group_event_attendance(count)
        `)
        .eq('group_id', groupId);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data: groupEvents, error } = await query.order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return groupEvents?.map(groupEvent => ({
        ...groupEvent,
        event: groupEvent.event,
        attendanceCount: groupEvent.attendance?.[0]?.count || 0,
        maxParticipants: groupEvent.max_participants
      })) || [];
    } catch (error) {
      console.error('Error getting group events:', error);
      throw new Error('Failed to get group events');
    }
  }

  /**
   * Record event attendance
   */
  static async recordAttendance(
    groupEventId: string,
    userId: string,
    status: 'attending' | 'not_attending' | 'excused',
    reason?: string
  ): Promise<GroupEventAttendance> {
    try {
      const attendanceData: NewGroupEventAttendance = {
        groupEventId,
        userId,
        status,
        reason,
        respondedAt: new Date()
      };

      const [attendance] = await db
        .insert(groupEventAttendance)
        .values(attendanceData)
        .onConflictDoUpdate({
          target: [groupEventAttendance.groupEventId, groupEventAttendance.userId],
          set: {
            status,
            reason,
            respondedAt: new Date(),
            updatedAt: new Date()
          }
        })
        .returning();

      return attendance;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw new Error('Failed to record attendance');
    }
  }
}

/**
 * GroupGradeService - Service for group grading system
 */
export class GroupGradeService {
  /**
   * Create a group grade
   */
  static async createGroupGrade(
    groupId: string,
    userId: string,
    gradeData: {
      gradeType: GradeType;
      score: string;
      maxScore?: string;
      feedback?: string;
      rubricData?: any;
      ticketId?: string;
      eventId?: string;
    },
    gradedBy: string
  ): Promise<GroupGrade> {
    try {
      const groupGradeData = {
        group_id: groupId,
        user_id: userId,
        grade_type: gradeData.gradeType,
        score: gradeData.score,
        max_score: gradeData.maxScore || '100.00',
        feedback: gradeData.feedback,
        rubric_data: gradeData.rubricData || {},
        ticket_id: gradeData.ticketId,
        event_id: gradeData.eventId,
        graded_by: gradedBy,
        graded_at: new Date().toISOString()
      };

      const { data: groupGrade, error } = await supabase
        .from('group_grades')
        .insert(groupGradeData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return groupGrade;
    } catch (error) {
      console.error('Error creating group grade:', error);
      throw new Error('Failed to create group grade');
    }
  }

  /**
   * Get group grades with details
   */
  static async getGroupGrades(groupId: string, userId?: string): Promise<GroupGradeWithDetails[]> {
    try {
      let query = supabase
        .from('group_grades')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email),
          graded_by:profiles!graded_by(id, full_name, email)
        `)
        .eq('group_id', groupId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: groupGrades, error } = await query.order('graded_at', { ascending: false });

      if (error) {
        throw error;
      }

      return groupGrades?.map(groupGrade => ({
        ...groupGrade,
        user: groupGrade.user,
        gradedBy: groupGrade.graded_by
      })) || [];
    } catch (error) {
      console.error('Error getting group grades:', error);
      throw new Error('Failed to get group grades');
    }
  }

  /**
   * Get user's average grade in group
   */
  static async getUserAverageGrade(groupId: string, userId: string): Promise<number> {
    try {
      const result = await db
        .select({
          averageScore: sql<number>`AVG(CAST(${groupGrades.score} AS DECIMAL))`
        })
        .from(groupGrades)
        .where(and(eq(groupGrades.groupId, groupId), eq(groupGrades.userId, userId)))
        .groupBy(groupGrades.userId);

      return result.length > 0 ? Number(result[0].averageScore) : 0;
    } catch (error) {
      console.error('Error calculating average grade:', error);
      return 0;
    }
  }
}

/**
 * GroupChatService - Service for group chat functionality
 */
export class GroupChatService {
  /**
   * Send a chat message
   */
  static async sendMessage(
    groupId: string,
    userId: string,
    content: string,
    messageType: 'text' | 'file' | 'image' | 'system' = 'text',
    attachments?: any[],
    replyTo?: string
  ): Promise<GroupChatMessage> {
    try {
      const messageData = {
        group_id: groupId,
        user_id: userId,
        content,
        message_type: messageType,
        attachments: attachments || [],
        reply_to: replyTo,
        created_at: new Date().toISOString()
      };

      const { data: message, error } = await supabase
        .from('group_chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get group chat messages with details
   */
  static async getGroupMessages(
    groupId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<GroupChatMessageWithDetails[]> {
    try {
      const { data: messages, error } = await supabase
        .from('group_chat_messages')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email, avatar_url),
          reply_to:group_chat_messages!reply_to(id, content, user:profiles!user_id(full_name))
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return messages?.map(message => ({
        ...message,
        user: message.user,
        replyTo: message.reply_to
      })) || [];
    } catch (error) {
      console.error('Error getting group messages:', error);
      throw new Error('Failed to get group messages');
    }
  }
}

/**
 * GroupAIService - Service for group AI assistant integration
 */
export class GroupAIService {
  /**
   * Create a shared AI session for group
   */
  static async createGroupAISession(
    groupId: string,
    sessionName: string,
    createdBy: string,
    isShared: boolean = true
  ): Promise<GroupAiSession> {
    try {
      console.log('Creating group AI session:', { groupId, sessionName, createdBy, isShared });
      
      // First create a chat session
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: createdBy
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        throw new Error(`Failed to create chat session: ${error.message}`);
      }

      console.log('Chat session created:', session);

      // Then create the group AI session association
      const groupAISessionData = {
        group_id: groupId,
        session_id: session.id,
        session_name: sessionName,
        is_shared: isShared,
        created_by: createdBy
      };

      console.log('Creating group AI session with data:', groupAISessionData);

      const { data: groupAISession, error: groupAISessionError } = await supabase
        .from('group_ai_sessions')
        .insert(groupAISessionData)
        .select()
        .single();

      if (groupAISessionError) {
        console.error('Error creating group AI session:', groupAISessionError);
        throw new Error(`Failed to create group AI session: ${groupAISessionError.message}`);
      }

      console.log('Group AI session created:', groupAISession);
      return groupAISession;
    } catch (error) {
      console.error('Error creating group AI session:', error);
      throw new Error('Failed to create group AI session');
    }
  }

  /**
   * Get group AI sessions
   */
  static async getGroupAISessions(groupId: string): Promise<GroupAiSession[]> {
    try {
      console.log('Getting group AI sessions for groupId:', groupId);
      
      const { data: sessions, error } = await supabase
        .from('group_ai_sessions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }

      console.log('Raw sessions data:', sessions);
      return sessions || [];
    } catch (error) {
      console.error('Error getting group AI sessions:', error);
      throw new Error('Failed to get group AI sessions');
    }
  }
}
