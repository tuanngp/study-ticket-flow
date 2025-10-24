// Test data fixtures for ticket scenarios
import { TicketFormData } from '../../services/ticketService';

// Valid ticket data for positive tests
export const validTicketData: TicketFormData = {
    title: "Valid ticket title",
    description: "Valid description with more than 10 characters to meet minimum requirements",
    type: "bug" as const,
    priority: "medium" as const,
    courseCode: "PRJ301",
    className: "SE1730",
    projectGroup: "Team 07",
};

export const validTicketVariations: TicketFormData[] = [
    {
        title: "Bug in login system",
        description: "Users cannot authenticate with valid credentials. The login form accepts input but returns error 401.",
        type: "bug",
        priority: "high",
        courseCode: "PRJ301",
        className: "SE1730",
        projectGroup: "Team 07",
    },
    {
        title: "Feature request for dark mode",
        description: "Add dark mode theme option to improve user experience during night time usage.",
        type: "feature",
        priority: "low",
        courseCode: "SWP391",
        className: "SE1731",
        projectGroup: "Team 05",
    },
    {
        title: "Question about database setup",
        description: "How do I configure the database connection for the development environment?",
        type: "question",
        priority: "medium",
        courseCode: "DBI202",
        className: "SE1732",
    },
    {
        title: "Task: Update documentation",
        description: "Update the API documentation to reflect recent changes in the authentication endpoints.",
        type: "task",
        priority: "low",
    },
];

// Invalid ticket data for negative tests
export const invalidTicketData: Partial<TicketFormData>[] = [
    { ...validTicketData, title: "" }, // TC03: Empty title
    { ...validTicketData, title: "   " }, // TC04: Whitespace-only title
    { ...validTicketData, description: "" }, // TC05: Empty description
    { ...validTicketData, description: "short" }, // TC06: Too short description
    { ...validTicketData, type: "invalid" as any }, // Invalid type
    { ...validTicketData, priority: "invalid" as any }, // Invalid priority
    { ...validTicketData, type: undefined }, // Missing type
    { ...validTicketData, priority: undefined }, // Missing priority
];

// Edge case ticket data for boundary testing
export const edgeTicketData: TicketFormData[] = [
    {
        ...validTicketData,
        title: "A".repeat(100), // TC07: Long title (boundary)
        description: "Valid description for long title test case"
    },
    {
        ...validTicketData,
        title: "Minimum length title",
        description: "A".repeat(1000) // TC08: Long description (boundary)
    },
    {
        ...validTicketData,
        description: "<script>alert('xss')</script>Test description", // XSS attempt
        title: "XSS test ticket"
    },
    {
        ...validTicketData,
        title: "   Whitespace title   ", // Whitespace handling
        description: "   Description with leading/trailing spaces   "
    },
    {
        ...validTicketData,
        title: "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
        description: "Testing special characters in description: !@#$%^&*()_+-=[]{}|;':\",./<>?"
    },
    {
        ...validTicketData,
        title: "Unicode test: 测试 🚀 émojis",
        description: "Testing unicode characters and emojis: 测试中文 🚀 français español"
    },
];

// Error scenario data
export const errorScenarioData = {
    networkTimeout: {
        ...validTicketData,
        title: "Network timeout test",
        description: "This ticket will trigger a network timeout scenario"
    },
    databaseError: {
        ...validTicketData,
        title: "Database error test",
        description: "This ticket will trigger a database connection error"
    },
    authenticationError: {
        ...validTicketData,
        title: "Auth error test",
        description: "This ticket will trigger an authentication error"
    },
};

// Educational context variations
export const educationalTicketData: TicketFormData[] = [
    {
        title: "Grading issue with assignment submission",
        description: "My assignment was submitted on time but shows as late in the system",
        type: "bug",
        priority: "high",
        courseCode: "PRJ301",
        className: "SE1730",
        projectGroup: "Team 07",
    },
    {
        title: "Configuration help for project setup",
        description: "Need help setting up the development environment for the group project",
        type: "question",
        priority: "medium",
        courseCode: "SWP391",
        className: "SE1731",
        projectGroup: "Team 05",
    },
    {
        title: "Technical support for exam platform",
        description: "Unable to access the online exam platform during the scheduled exam time",
        type: "bug",
        priority: "critical",
        courseCode: "PRN231",
        className: "SE1732",
    },
];

// Comprehensive test data collection
export const testTicketData = {
    valid: validTicketData,
    validVariations: validTicketVariations,
    invalid: invalidTicketData,
    edge: edgeTicketData,
    error: errorScenarioData,
    educational: educationalTicketData,
};