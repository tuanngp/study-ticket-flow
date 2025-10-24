import { UnifiedTicketCreation } from '@/components/UnifiedTicketCreation';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSupabase, resetMockSupabase } from '../__mocks__/supabase';
import { errorScenarioData, validTicketData } from '../fixtures/ticketData';

// Mock the TicketService
vi.mock('@/services/ticketService', () => ({
    TicketService: {
        getAITriageSuggestions: vi.fn(),
        createTicket: vi.fn(),
        validateTicketData: vi.fn(),
    },
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabase,
}));

describe('UnifiedTicketCreation - Form Submission Handling', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        resetMockSupabase();
    });

    // ===== POSITIVE TESTS =====

    /**
     * TC26: Successful form submission with valid data
     * Requirements: 2.1, 4.1
     */
    it('TC26: should successfully submit form with valid data', async () => {
        const user = userEvent.setup();

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in the form with valid data
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, validTicketData.title);
        await user.type(descriptionInput, validTicketData.description);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        // Verify onSubmit was called with form data
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: validTicketData.title,
                    description: validTicketData.description,
                })
            );
        });
    });

    /**
     * TC27: Successful form submission with all optional fields
     * Requirements: 2.1, 4.1
     */
    it('TC27: should successfully submit form with all optional fields filled', async () => {
        const user = userEvent.setup();

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in title and description first (on quick tab)
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, validTicketData.title);
        await user.type(descriptionInput, validTicketData.description);

        // Switch to detailed tab to access optional fields
        const detailedTab = screen.getByRole('tab', { name: /detailed/i });
        await user.click(detailedTab);

        // Fill in optional fields
        const courseCodeInput = screen.getByPlaceholderText(/e\.g\., PRJ301/i);
        const classNameInput = screen.getByPlaceholderText(/e\.g\., SE1730/i);
        const projectGroupInput = screen.getByPlaceholderText(/e\.g\., Team 07/i);

        await user.type(courseCodeInput, validTicketData.courseCode!);
        await user.type(classNameInput, validTicketData.className!);
        await user.type(projectGroupInput, validTicketData.projectGroup!);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        // Verify onSubmit was called with all data
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: validTicketData.title,
                    description: validTicketData.description,
                    courseCode: validTicketData.courseCode,
                    className: validTicketData.className,
                    projectGroup: validTicketData.projectGroup,
                })
            );
        });
    });

    // ===== NEGATIVE TESTS =====

    /**
     * TC28: Form submission fails with empty title
     * Requirements: 2.2, 4.2
     */
    it('TC28: should prevent submission with empty title', async () => {
        const user = userEvent.setup();

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill only description, leave title empty
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);
        await user.type(descriptionInput, validTicketData.description);

        // Verify submit button is disabled (prevents submission)
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        expect(submitButton).toBeDisabled();

        // Verify onSubmit is never called
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    /**
     * TC29: Form submission fails with empty description
     * Requirements: 2.2, 4.2
     */
    it('TC29: should prevent submission with empty description', async () => {
        const user = userEvent.setup();

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill only title, leave description empty
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        await user.type(titleInput, validTicketData.title);

        // Verify submit button is disabled (prevents submission)
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        expect(submitButton).toBeDisabled();

        // Verify onSubmit is never called
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    // ===== EDGE TESTS =====

    /**
     * TC30: Form handles network timeout gracefully
     * Requirements: 2.4, 4.3
     */
    it('TC30: should handle network timeout during submission', async () => {
        const user = userEvent.setup();

        // Mock onSubmit to simulate network timeout
        const timeoutError = new Error('Network timeout');
        mockOnSubmit.mockRejectedValueOnce(timeoutError);

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in valid data
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, errorScenarioData.networkTimeout.title);
        await user.type(descriptionInput, errorScenarioData.networkTimeout.description);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        // Verify the form attempted submission
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });

        // Verify button returns to normal state after error
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
            expect(screen.queryByText(/creating/i)).not.toBeInTheDocument();
        });
    });

    /**
     * TC31: Form handles database error gracefully
     * Requirements: 2.4, 4.3
     */
    it('TC31: should handle database error during submission', async () => {
        const user = userEvent.setup();

        // Mock onSubmit to simulate database error
        const dbError = new Error('Database connection failed');
        mockOnSubmit.mockRejectedValueOnce(dbError);

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in valid data
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, errorScenarioData.databaseError.title);
        await user.type(descriptionInput, errorScenarioData.databaseError.description);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        // Verify the form attempted submission
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });

        // Verify button returns to normal state after error
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });

    // ===== ERROR TESTS =====

    /**
     * TC32: Form handles authentication failure
     * Requirements: 2.4, 4.4
     */
    it('TC32: should handle authentication failure during submission', async () => {
        const user = userEvent.setup();

        // Mock onSubmit to simulate authentication error
        const authError = new Error('Authentication failed');
        mockOnSubmit.mockRejectedValueOnce(authError);

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in valid data
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, errorScenarioData.authenticationError.title);
        await user.type(descriptionInput, errorScenarioData.authenticationError.description);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        // Verify the form attempted submission
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });

        // Verify button returns to normal state after error
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });

    // ===== ADDITIONAL FORM BEHAVIOR TESTS =====

    /**
     * Test: Submit button is disabled when form is invalid
     */
    it('should disable submit button when title or description is empty', () => {
        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const submitButton = screen.getByRole('button', { name: /create ticket/i });

        // Button should be disabled initially (empty form)
        expect(submitButton).toBeDisabled();
    });

    /**
     * Test: Submit button shows loading state during submission
     */
    it('should show loading state during form submission', async () => {
        const user = userEvent.setup();

        // Mock onSubmit to delay resolution
        mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in valid data
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, validTicketData.title);
        await user.type(descriptionInput, validTicketData.description);

        // Submit the form
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        // Verify loading state is shown
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();

        // Wait for submission to complete
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });
    });

    /**
     * Test: Cancel button calls onCancel handler
     */
    it('should call onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
});

describe('UnifiedTicketCreation - AI Suggestion Integration', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        resetMockSupabase();
    });

    /**
     * Test: AI suggestions are displayed when available
     * Requirements: 2.5
     */
    it('should display AI suggestions when analysis completes', async () => {
        const user = userEvent.setup();

        // Mock TicketService to return AI suggestions
        const { TicketService } = await import('@/services/ticketService');
        vi.mocked(TicketService.getAITriageSuggestions).mockResolvedValue({
            suggested_type: 'bug',
            suggested_priority: 'high',
            analysis: 'This appears to be a critical bug',
            suggestedType: 'bug',
            suggestedPriority: 'high',
        });

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form to trigger AI analysis
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'Critical bug in login system');
        await user.type(descriptionInput, 'Users cannot authenticate with valid credentials');

        // Wait for AI suggestions to appear (debounced)
        await waitFor(() => {
            expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Verify suggestion content is displayed
        expect(screen.getByText(/suggested type/i)).toBeInTheDocument();
        expect(screen.getByText(/suggested priority/i)).toBeInTheDocument();
        expect(screen.getByText(/this appears to be a critical bug/i)).toBeInTheDocument();
    });

    /**
     * Test: Apply AI suggested type to form
     * Requirements: 2.5
     */
    it('should apply AI suggested type when Apply button is clicked', async () => {
        const user = userEvent.setup();

        // Mock TicketService to return AI suggestions
        const { TicketService } = await import('@/services/ticketService');
        vi.mocked(TicketService.getAITriageSuggestions).mockResolvedValue({
            suggested_type: 'bug',
            suggested_priority: 'high',
            analysis: 'This appears to be a critical bug',
            suggestedType: 'bug',
            suggestedPriority: 'high',
        });

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form to trigger AI analysis
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'Critical bug in login system');
        await user.type(descriptionInput, 'Users cannot authenticate with valid credentials');

        // Wait for AI suggestions to appear
        await waitFor(() => {
            expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click Apply button for type suggestion
        const applyButtons = screen.getAllByRole('button', { name: /apply/i });
        await user.click(applyButtons[0]); // First Apply button is for type

        // Submit form and verify the suggested type was applied
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'bug',
                })
            );
        });
    });

    /**
     * Test: Apply AI suggested priority to form
     * Requirements: 2.5
     */
    it('should apply AI suggested priority when Apply button is clicked', async () => {
        const user = userEvent.setup();

        // Mock TicketService to return AI suggestions
        const { TicketService } = await import('@/services/ticketService');
        vi.mocked(TicketService.getAITriageSuggestions).mockResolvedValue({
            suggested_type: 'bug',
            suggested_priority: 'critical',
            analysis: 'This is a critical issue',
            suggestedType: 'bug',
            suggestedPriority: 'critical',
        });

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form to trigger AI analysis
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'System crash on startup');
        await user.type(descriptionInput, 'Application crashes immediately when launched');

        // Wait for AI suggestions to appear
        await waitFor(() => {
            expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click Apply button for priority suggestion
        const applyButtons = screen.getAllByRole('button', { name: /apply/i });
        await user.click(applyButtons[1]); // Second Apply button is for priority

        // Submit form and verify the suggested priority was applied
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: 'critical',
                })
            );
        });
    });

    /**
     * Test: Dismiss AI suggestions
     * Requirements: 2.5
     */
    it('should dismiss AI suggestions when Dismiss button is clicked', async () => {
        const user = userEvent.setup();

        // Mock TicketService to return AI suggestions
        const { TicketService } = await import('@/services/ticketService');
        vi.mocked(TicketService.getAITriageSuggestions).mockResolvedValue({
            suggested_type: 'feature',
            suggested_priority: 'low',
            analysis: 'This is a feature request',
            suggestedType: 'feature',
            suggestedPriority: 'low',
        });

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form to trigger AI analysis
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'Add dark mode feature');
        await user.type(descriptionInput, 'Would be nice to have a dark mode option');

        // Wait for AI suggestions to appear
        await waitFor(() => {
            expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
        }, { timeout: 2000 });

        // Click Dismiss button
        const dismissButton = screen.getByRole('button', { name: /dismiss/i });
        await user.click(dismissButton);

        // Verify suggestions are no longer visible
        await waitFor(() => {
            expect(screen.queryByText(/ai suggestions/i)).not.toBeInTheDocument();
        });
    });

    /**
     * Test: AI analysis shows loading indicator
     * Requirements: 2.5
     */
    it('should show loading indicator during AI analysis', async () => {
        const user = userEvent.setup();

        // Mock TicketService with delayed response
        const { TicketService } = await import('@/services/ticketService');
        vi.mocked(TicketService.getAITriageSuggestions).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve({
                suggested_type: 'bug',
                suggested_priority: 'high',
                analysis: 'Analysis complete',
                suggestedType: 'bug',
                suggestedPriority: 'high',
            }), 1500))
        );

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form to trigger AI analysis
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'Bug in payment system');
        await user.type(descriptionInput, 'Payment processing fails intermittently');

        // Wait a bit for debounce and check for loading indicator
        await waitFor(() => {
            const loadingSpinner = document.querySelector('.animate-spin');
            expect(loadingSpinner).toBeInTheDocument();
        }, { timeout: 1500 });
    });

    /**
     * Test: AI suggestions not shown for short input
     * Requirements: 2.5
     */
    it('should not trigger AI analysis for short title or description', async () => {
        const user = userEvent.setup();

        // Mock TicketService
        const { TicketService } = await import('@/services/ticketService');
        const aiMock = vi.mocked(TicketService.getAITriageSuggestions);

        render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form with short input
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'Short');
        await user.type(descriptionInput, 'Too short');

        // Wait for debounce period
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Verify AI service was not called
        expect(aiMock).not.toHaveBeenCalled();
        expect(screen.queryByText(/ai suggestions/i)).not.toBeInTheDocument();
    });

    /**
     * Test: Handle AI service failure gracefully
     * Requirements: 2.5
     */
    it('should handle AI service failure gracefully', async () => {
        const user = userEvent.setup();

        // Mock TicketService to throw error - reset first to clear previous mocks
        const { TicketService } = await import('@/services/ticketService');
        vi.mocked(TicketService.getAITriageSuggestions).mockReset();
        vi.mocked(TicketService.getAITriageSuggestions).mockRejectedValue(
            new Error('AI service unavailable')
        );

        const { unmount } = render(
            <UnifiedTicketCreation
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Fill in form to trigger AI analysis
        const titleInput = screen.getByPlaceholderText(/brief, descriptive title/i);
        const descriptionInput = screen.getByPlaceholderText(/detailed description/i);

        await user.type(titleInput, 'Bug in authentication');
        await user.type(descriptionInput, 'Users cannot log in with correct credentials');

        // Wait for AI analysis attempt and error handling
        await waitFor(() => {
            // Verify form is still functional despite AI failure
            const submitButton = screen.getByRole('button', { name: /create ticket/i });
            expect(submitButton).not.toBeDisabled();
        }, { timeout: 2000 });

        // Verify the form can still be submitted
        const submitButton = screen.getByRole('button', { name: /create ticket/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalled();
        });

        unmount();
    });
});
