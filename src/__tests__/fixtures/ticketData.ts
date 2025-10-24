// Test data fixtures for ticket scenarios

export const validTicketData = {
    title: "Valid ticket title",
    description: "Valid description with more than 10 characters to meet minimum requirements",
    type: "bug" as const,
    priority: "medium" as const,
    courseCode: "PRJ301",
    className: "SE1730",
    projectGroup: "Team 07",
}

export const invalidTicketData = [
    { ...validTicketData, title: "" }, // Empty title
    { ...validTicketData, description: "short" }, // Short description
    { ...validTicketData, type: "invalid" as any }, // Invalid type
    { ...validTicketData, priority: "invalid" as any }, // Invalid priority
    { ...validTicketData, courseCode: "" }, // Empty course code
]

export const edgeTicketData = [
    { ...validTicketData, title: "A".repeat(100) }, // Long title
    { ...validTicketData, description: "A".repeat(1000) }, // Long description
    { ...validTicketData, description: "<script>alert('xss')</script>" }, // XSS attempt
    { ...validTicketData, title: "   Whitespace title   " }, // Whitespace handling
]