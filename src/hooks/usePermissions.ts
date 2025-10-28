import { useAuth } from './useAuth';

export type UserRole = 'student' | 'instructor' | 'admin' | 'lead' | 'manager';

export interface RolePermissions {
  canCreateTickets: boolean;
  canAssignTickets: boolean;
  canResolveTickets: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canAccessAllCourses: boolean;
  canOverrideAI: boolean;
  canReviewTickets: boolean;
  canViewReviews: boolean;
  canManageReviews: boolean;
  // Group system permissions
  canCreateGroups: boolean;
  canManageGroups: boolean;
  canJoinGroups: boolean;
  canGradeStudents: boolean;
  canViewAllGroups: boolean;
  canManageGroupMembers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  student: {
    canCreateTickets: true,
    canAssignTickets: false,
    canResolveTickets: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canAccessAllCourses: false,
    canOverrideAI: false,
    canReviewTickets: false,
    canViewReviews: true, // Students can view reviews of their tickets
    canManageReviews: false,
    // Group permissions for students
    canCreateGroups: false,
    canManageGroups: false,
    canJoinGroups: true,
    canGradeStudents: false,
    canViewAllGroups: false,
    canManageGroupMembers: false,
  },
  lead: { // Teaching Assistant Lead
    canCreateTickets: true,
    canAssignTickets: true,
    canResolveTickets: true,
    canViewAnalytics: true,
    canManageUsers: false,
    canAccessAllCourses: false, // Only assigned courses
    canOverrideAI: true,
    canReviewTickets: true,
    canViewReviews: true,
    canManageReviews: true,
    // Group permissions for leads
    canCreateGroups: true,
    canManageGroups: true,
    canJoinGroups: true,
    canGradeStudents: true,
    canViewAllGroups: false, // Only assigned courses
    canManageGroupMembers: true,
  },
  instructor: {
    canCreateTickets: true,
    canAssignTickets: true,
    canResolveTickets: true,
    canViewAnalytics: true,
    canManageUsers: false,
    canAccessAllCourses: false, // Only assigned courses
    canOverrideAI: true,
    canReviewTickets: true, // Instructors can review tickets
    canViewReviews: true,
    canManageReviews: true, // Can manage their own reviews
    // Group permissions for instructors
    canCreateGroups: true,
    canManageGroups: true,
    canJoinGroups: true,
    canGradeStudents: true,
    canViewAllGroups: false, // Only assigned courses
    canManageGroupMembers: true,
  },
  manager: { // Department Manager
    canCreateTickets: true,
    canAssignTickets: true,
    canResolveTickets: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canAccessAllCourses: true, // All courses in department
    canOverrideAI: true,
    canReviewTickets: true,
    canViewReviews: true,
    canManageReviews: true,
    // Group permissions for managers
    canCreateGroups: true,
    canManageGroups: true,
    canJoinGroups: true,
    canGradeStudents: true,
    canViewAllGroups: true, // All groups in department
    canManageGroupMembers: true,
  },
  admin: {
    canCreateTickets: true,
    canAssignTickets: true,
    canResolveTickets: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canAccessAllCourses: true, // All courses university-wide
    canOverrideAI: true,
    canReviewTickets: true, // Admins can review any ticket
    canViewReviews: true,
    canManageReviews: true, // Can manage all reviews
    // Group permissions for admins
    canCreateGroups: true,
    canManageGroups: true,
    canJoinGroups: true,
    canGradeStudents: true,
    canViewAllGroups: true, // All groups university-wide
    canManageGroupMembers: true,
  },
};

export const usePermissions = () => {
  const { user, profile } = useAuth();

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    const role = (profile?.role || user?.role) as UserRole | undefined;
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.[permission] || false;
  };

  const canAccessCourse = (courseId: string): boolean => {
    if (!user) return false;

    // Admin can access all courses
    if (user.role === 'admin') return true;

    // For now, all users can access all courses
    // In the future, this can be enhanced with course-specific permissions
    return true;
  };

  const canReviewTicket = (ticketId: string): boolean => {
    if (!user) return false;
    return hasPermission('canReviewTickets');
  };

  const canViewTicketReviews = (ticketId: string): boolean => {
    if (!user) return false;
    return hasPermission('canViewReviews');
  };

  const canManageTicketReviews = (ticketId: string): boolean => {
    if (!user) return false;
    return hasPermission('canManageReviews');
  };

  return {
    hasPermission,
    canAccessCourse,
    canReviewTicket,
    canViewTicketReviews,
    canManageTicketReviews,
    userRole: (profile?.role || user?.role) as UserRole,
    isStudent: (profile?.role || user?.role) === 'student',
    isLead: (profile?.role || user?.role) === 'lead',
    isInstructor: (profile?.role || user?.role) === 'instructor',
    isManager: (profile?.role || user?.role) === 'manager',
    isAdmin: (profile?.role || user?.role) === 'admin',
    // Group permission helpers
    canCreateGroups: hasPermission('canCreateGroups'),
    canManageGroups: hasPermission('canManageGroups'),
    canJoinGroups: hasPermission('canJoinGroups'),
    canGradeStudents: hasPermission('canGradeStudents'),
    canViewAllGroups: hasPermission('canViewAllGroups'),
    canManageGroupMembers: hasPermission('canManageGroupMembers'),
  };
};
