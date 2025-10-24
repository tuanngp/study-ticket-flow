// User profile test data for authentication scenarios

export const validUserProfiles = {
    student: {
        id: "user-123",
        email: "student@example.com",
        role: "student",
        courseCode: "PRJ301",
        className: "SE1730",
        projectGroup: "Team 07",
    },

    instructor: {
        id: "instructor-456",
        email: "instructor@example.com",
        role: "instructor",
        courseCode: "PRJ301",
        className: "SE1730",
    },

    admin: {
        id: "admin-789",
        email: "admin@example.com",
        role: "admin",
    },
}

export const invalidUserProfiles = {
    expiredSession: {
        id: "expired-user",
        email: "expired@example.com",
        sessionExpired: true,
    },

    missingPermissions: {
        id: "no-perms-user",
        email: "noperms@example.com",
        role: "guest",
    },

    malformedProfile: {
        invalid: "data",
        missing: "required_fields",
    },
}

export const authTokens = {
    validToken: "valid-jwt-token-123",
    expiredToken: "expired-jwt-token-456",
    invalidToken: "invalid-token-format",
    missingToken: null,
}