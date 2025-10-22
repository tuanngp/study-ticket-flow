import { useAuth } from './useAuth';

export type UserRole = 'student' | 'instructor' | 'admin';

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
    isInstructor: (profile?.role || user?.role) === 'instructor',
    isAdmin: (profile?.role || user?.role) === 'admin',
  };
};
