// User profile test data for authentication scenarios

export interface TestUserProfile {
    id: string;
    email: string;
    role: 'student' | 'instructor' | 'admin' | 'guest';
    courseCode?: string;
    className?: string;
    projectGroup?: string;
    sessionExpired?: boolean;
    permissions?: string[];
    createdAt?: string;
    lastLogin?: string;
}

export interface TestAuthToken {
    token: string | null;
    expiresAt?: string;
    userId?: string;
    role?: string;
}

// Valid user profiles for positive tests
export const validUserProfiles: Record<string, TestUserProfile> = {
    student: {
        id: "user-123",
        email: "student@fpt.edu.vn",
        role: "student",
        courseCode: "PRJ301",
        className: "SE1730",
        projectGroup: "Team 07",
        permissions: ["create_ticket", "view_own_tickets", "comment"],
        createdAt: "2024-01-15T08:00:00Z",
        lastLogin: "2024-01-20T09:30:00Z",
    },

    instructor: {
        id: "instructor-456",
        email: "instructor@fpt.edu.vn",
        role: "instructor",
        courseCode: "PRJ301",
        className: "SE1730",
        permissions: ["create_ticket", "view_all_tickets", "assign_tickets", "comment", "close_tickets"],
        createdAt: "2024-01-10T08:00:00Z",
        lastLogin: "2024-01-20T10:00:00Z",
    },

    admin: {
        id: "admin-789",
        email: "admin@fpt.edu.vn",
        role: "admin",
        permissions: ["*"], // All permissions
        createdAt: "2024-01-01T08:00:00Z",
        lastLogin: "2024-01-20T11:00:00Z",
    },

    studentMultipleCourses: {
        id: "user-456",
        email: "student2@fpt.edu.vn",
        role: "student",
        courseCode: "SWP391",
        className: "SE1731",
        projectGroup: "Team 05",
        permissions: ["create_ticket", "view_own_tickets", "comment"],
        createdAt: "2024-01-12T08:00:00Z",
        lastLogin: "2024-01-19T14:30:00Z",
    },

    instructorMultipleClasses: {
        id: "instructor-789",
        email: "instructor2@fpt.edu.vn",
        role: "instructor",
        permissions: ["create_ticket", "view_all_tickets", "assign_tickets", "comment", "close_tickets"],
        createdAt: "2024-01-08T08:00:00Z",
        lastLogin: "2024-01-20T08:45:00Z",
    },
};

// Invalid user profiles for negative tests
export const invalidUserProfiles: Record<string, Partial<TestUserProfile> | any> = {
    expiredSession: {
        id: "expired-user",
        email: "expired@fpt.edu.vn",
        role: "student",
        sessionExpired: true,
        courseCode: "PRJ301",
        className: "SE1730",
    },

    missingPermissions: {
        id: "no-perms-user",
        email: "noperms@fpt.edu.vn",
        role: "guest",
        permissions: [],
    },

    malformedProfile: {
        invalid: "data",
        missing: "required_fields",
        wrongType: 123,
    },

    missingId: {
        email: "noid@fpt.edu.vn",
        role: "student",
        // Missing id field
    },

    missingEmail: {
        id: "user-no-email",
        role: "student",
        // Missing email field
    },

    invalidRole: {
        id: "invalid-role-user",
        email: "invalid@fpt.edu.vn",
        role: "invalid_role",
    },

    nullProfile: null,

    undefinedProfile: undefined,

    emptyProfile: {},
};

// Authentication tokens for testing
export const authTokens: Record<string, TestAuthToken> = {
    validToken: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validtoken",
        expiresAt: "2024-12-31T23:59:59Z",
        userId: "user-123",
        role: "student",
    },

    expiredToken: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expiredtoken",
        expiresAt: "2024-01-01T00:00:00Z",
        userId: "expired-user",
        role: "student",
    },

    invalidToken: {
        token: "invalid-token-format-not-jwt",
        userId: "invalid-user",
        role: "unknown",
    },

    missingToken: {
        token: null,
    },

    malformedToken: {
        token: "not.a.valid.jwt.token.format",
    },

    adminToken: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admintoken",
        expiresAt: "2024-12-31T23:59:59Z",
        userId: "admin-789",
        role: "admin",
    },

    instructorToken: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.instructortoken",
        expiresAt: "2024-12-31T23:59:59Z",
        userId: "instructor-456",
        role: "instructor",
    },
};

// Authentication scenarios for testing
export const authScenarios = {
    validAuthentication: {
        user: validUserProfiles.student,
        token: authTokens.validToken,
    },

    expiredAuthentication: {
        user: invalidUserProfiles.expiredSession,
        token: authTokens.expiredToken,
    },

    invalidAuthentication: {
        user: invalidUserProfiles.malformedProfile,
        token: authTokens.invalidToken,
    },

    missingAuthentication: {
        user: null,
        token: authTokens.missingToken,
    },

    adminAuthentication: {
        user: validUserProfiles.admin,
        token: authTokens.adminToken,
    },

    instructorAuthentication: {
        user: validUserProfiles.instructor,
        token: authTokens.instructorToken,
    },
};

// Permission test scenarios
export const permissionScenarios = {
    studentPermissions: {
        user: validUserProfiles.student,
        allowedActions: ["create_ticket", "view_own_tickets", "comment"],
        deniedActions: ["view_all_tickets", "assign_tickets", "close_tickets", "delete_tickets"],
    },

    instructorPermissions: {
        user: validUserProfiles.instructor,
        allowedActions: ["create_ticket", "view_all_tickets", "assign_tickets", "comment", "close_tickets"],
        deniedActions: ["delete_tickets", "manage_users"],
    },

    adminPermissions: {
        user: validUserProfiles.admin,
        allowedActions: ["*"], // All actions allowed
        deniedActions: [], // No restrictions
    },

    guestPermissions: {
        user: invalidUserProfiles.missingPermissions,
        allowedActions: [],
        deniedActions: ["create_ticket", "view_tickets", "comment"],
    },
};

// Comprehensive user test data
export const userTestData = {
    valid: validUserProfiles,
    invalid: invalidUserProfiles,
    tokens: authTokens,
    scenarios: authScenarios,
    permissions: permissionScenarios,
};