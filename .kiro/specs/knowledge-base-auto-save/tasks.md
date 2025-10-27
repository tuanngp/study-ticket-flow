# Implementation Plan: Knowledge Base Auto-Save

- [x] 1. Database schema and migrations

  - [x] 1.1 Create knowledge_entries table with vector index

    - Write SQL migration for knowledge_entries table
    - Add pgvector column for question_embedding (768 dimensions)
    - Create IVFFlat index for vector similarity search
    - Add constraints for visibility validation
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

  - [x] 1.2 Create knowledge_feedback table

    - Write SQL migration for knowledge_feedback table
    - Add foreign keys to knowledge_entries, profiles, and tickets
    - Create unique constraint for entry_id + student_id + ticket_id
    - Add indexes for performance
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 1.3 Create knowledge_suggestions table

    - Write SQL migration for knowledge_suggestions table
    - Add tracking fields for suggestion display and interaction
    - Create indexes for ticket_id and entry_id lookups
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.4 Add RLS policies for access control

    - Write RLS policy for instructors to manage their own entries
    - Write RLS policy for students to view permitted entries based on visibility
    - Write RLS policy for feedback submission (students only)
    - Test policies with different user roles
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Update database schema types

  - [x] 2.1 Add new tables to Drizzle schema

    - Define knowledge_entries table in src/db/schema.ts
    - Define knowledge_feedback table in src/db/schema.ts
    - Define knowledge_suggestions table in src/db/schema.ts
    - Add relations between tables
    - _Requirements: 1.1, 4.1, 2.1_

  - [x] 2.2 Generate TypeScript types

    - Run drizzle-kit generate to create types
    - Export types from schema file
    - Verify types match database schema
    - _Requirements: 1.1, 4.1, 2.1_

- [x] 3. Implement KnowledgeEntryService

  - [x] 3.1 Create service file and base structure

    - Create src/services/knowledgeEntryService.ts
    - Define TypeScript interfaces for KnowledgeEntry and CreateKnowledgeEntryInput
    - Define error types and error codes
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Implement createEntry method

    - Write createEntry method that accepts CreateKnowledgeEntryInput
    - Generate embedding for question text using EmbeddingService
    - Insert entry into knowledge_entries table with embedding
    - Handle errors and return created entry
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.3 Implement updateEntry method with versioning

    - Write updateEntry method that creates new version
    - Link new version to previous version via previous_version_id
    - Increment version number
    - Generate new embedding if question text changed
    - _Requirements: 3.2, 3.4, 3.5_

  - [x] 3.4 Implement deleteEntry method

    - Write deleteEntry method with authorization check
    - Verify instructor owns the entry before deletion
    - Delete entry from database
    - _Requirements: 3.3_

  - [x] 3.5 Implement getInstructorEntries method

    - Write method to fetch entries by instructor_id
    - Add optional filters for course_code, visibility, search term
    - Order by updated_at descending
    - _Requirements: 3.1_

  - [x] 3.6 Implement getVersionHistory method

    - Write method to fetch all versions of an entry
    - Follow previous_version_id chain
    - Return versions ordered by version number
    - _Requirements: 3.5_

  - [x] 3.7 Implement updateStatistics method

    - Write method to increment view_count, helpful_count, not_helpful_count
    - Use atomic increment operations
    - _Requirements: 4.4, 4.5_

- [x] 4. Implement KnowledgeSuggestionService

  - [x] 4.1 Create service file and base structure

    - Create src/services/knowledgeSuggestionService.ts
    - Define TypeScript interfaces for KnowledgeSuggestion and SuggestionFeedback
    - Define constants for similarity threshold (0.7) and max results (3)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 4.2 Implement findSimilarEntries method

    - Generate embedding for input question text
    - Perform vector similarity search using pgvector cosine similarity
    - Filter by visibility rules (public or matching course_code)
    - Filter by similarity threshold (>= 0.7)
    - Join with profiles to get instructor info
    - Return top 3 results ordered by similarity score
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.2_

  - [x] 4.3 Implement recordSuggestions method

    - Write method to insert suggestion records into knowledge_suggestions table
    - Store ticket_id, entry_id, similarity_score, rank_position
    - Handle duplicate suggestions gracefully
    - _Requirements: 2.2_

  - [x] 4.4 Implement submitFeedback method

    - Write method to insert feedback into knowledge_feedback table
    - Update entry statistics via KnowledgeEntryService.updateStatistics
    - Handle duplicate feedback (unique constraint)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.5 Implement getTicketSuggestions method

    - Write method to fetch suggestions for a specific ticket
    - Join with knowledge_entries and profiles
    - Return full suggestion details
    - _Requirements: 2.3, 2.4_

  - [x] 4.6 Implement getEntryFeedbackStats method

    - Write method to calculate feedback statistics for an entry
    - Count total feedback, helpful, not helpful
    - Calculate helpful percentage
    - _Requirements: 4.5_

- [x] 5. Create SaveToKnowledgeBaseDialog component

  - [x] 5.1 Create component file and base structure

    - Create src/components/SaveToKnowledgeBaseDialog.tsx
    - Define component props interface
    - Set up form with react-hook-form and zod validation
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Implement form fields and validation

    - Add question text field (pre-filled, editable)
    - Add answer text field (pre-filled, editable)
    - Add tags input with multi-select
    - Add visibility selector (public/course-specific radio)
    - Add course code field (conditional on visibility)
    - Implement validation rules (required fields, max lengths)
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.4_

  - [x] 5.3 Implement save functionality

    - Wire up form submission to KnowledgeEntryService.createEntry
    - Show loading state during save
    - Display success message on completion
    - Call onSave callback with created entry
    - Handle errors and display error messages
    - _Requirements: 1.4, 1.5_

  - [x] 5.4 Add preview section

    - Show preview of how entry will appear to students
    - Display formatted question and answer
    - Show instructor name and avatar
    - _Requirements: 1.3_

- [x] 6. Create KnowledgeSuggestionCard component

  - [x] 6.1 Create component file and base structure

    - Create src/components/KnowledgeSuggestionCard.tsx
    - Define component props interface
    - Set up card layout with shadcn/ui Card component
    - _Requirements: 2.3, 2.4_

  - [x] 6.2 Implement suggestion display

    - Display question text with similarity indicator (badge or progress bar)
    - Display truncated answer text with "Read more" expansion
    - Display instructor info (avatar, name)
    - Show helpful percentage if available
    - _Requirements: 2.3, 2.4, 4.5_

  - [x] 6.3 Implement feedback buttons

    - Add "Helpful" and "Not helpful" buttons
    - Disable buttons after feedback submitted
    - Show visual feedback on button click
    - Call onFeedback callback with boolean value
    - _Requirements: 4.1, 4.2_

  - [x] 6.4 Implement view details functionality

    - Add "View full answer" button
    - Call onViewDetails callback to show full entry in dialog
    - Track view interaction
    - _Requirements: 2.4_

- [x] 7. Create AutoSuggestionPanel component

  - [x] 7.1 Create component file and base structure

    - Create src/components/AutoSuggestionPanel.tsx
    - Define component props interface
    - Set up panel layout with collapsible section
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 7.2 Implement suggestion fetching

    - Use React Query to fetch suggestions via KnowledgeSuggestionService.findSimilarEntries
    - Pass question text and course code as parameters
    - Handle loading state with skeleton loaders
    - Handle error state with retry option
    - _Requirements: 2.1, 2.5_

  - [x] 7.3 Implement suggestion list display

    - Map suggestions to KnowledgeSuggestionCard components
    - Show "No suggestions found" empty state when results are empty
    - Display suggestions count badge
    - _Requirements: 2.2, 2.3_

  - [x] 7.4 Implement feedback handling

    - Wire up feedback submission to KnowledgeSuggestionService.submitFeedback
    - Update UI after feedback submitted
    - Show success toast notification
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.5 Record suggestion display

    - Call KnowledgeSuggestionService.recordSuggestions when suggestions are shown
    - Pass ticket ID and suggestion details
    - _Requirements: 2.2_

- [x] 8. Create KnowledgeEntryManager component

  - [x] 8.1 Create component file and base structure

    - Create src/components/KnowledgeEntryManager.tsx
    - Define component props interface
    - Set up page layout with header and filters
    - _Requirements: 3.1_

  - [x] 8.2 Implement entry list display

    - Use React Query to fetch entries via KnowledgeEntryService.getInstructorEntries
    - Display entries in table or card grid
    - Show entry statistics (views, helpful %, feedback count)
    - Show visibility badge (public/course-specific)
    - _Requirements: 3.1, 4.5_

  - [x] 8.3 Implement search and filters

    - Add search input for question/answer text
    - Add filter dropdown for visibility
    - Add filter dropdown for course code
    - Update query when filters change
    - _Requirements: 3.1_

  - [x] 8.4 Implement edit functionality

    - Add edit button for each entry
    - Open SaveToKnowledgeBaseDialog in edit mode
    - Pre-fill form with existing entry data
    - Call KnowledgeEntryService.updateEntry on save
    - Refresh list after update
    - _Requirements: 3.2, 3.4_

  - [x] 8.5 Implement delete functionality

    - Add delete button with confirmation dialog
    - Call KnowledgeEntryService.deleteEntry on confirm
    - Show success message and refresh list
    - _Requirements: 3.3_

  - [x] 8.6 Implement version history viewer

    - Add "View history" button for entries with versions > 1
    - Open dialog showing version timeline
    - Fetch versions via KnowledgeEntryService.getVersionHistory
    - Display diff between versions
    - _Requirements: 3.5_

- [x] 9. Integrate save option into TicketDetail page

  - [x] 9.1 Add "Save to Knowledge Base" button

    - Add button to instructor comment submission area
    - Show button only for instructors
    - Position button near submit comment button
    - _Requirements: 1.1_

  - [x] 9.2 Wire up SaveToKnowledgeBaseDialog

    - Open dialog when button clicked
    - Pre-fill question from ticket title/description
    - Pre-fill answer from comment text
    - Pass ticket ID and course code
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 9.3 Handle save success

    - Show success toast notification

    - Optionally display saved entry badge on comment
    - _Requirements: 1.5_

- [x] 10. Integrate auto-suggestions into NewTicket page

  - [x] 10.1 Add AutoSuggestionPanel to ticket creation form

    - Position panel below description field
    - Show panel only when description has sufficient text (>50 chars)
    - Pass question text from title + description
    - Pass course code from form
    - _Requirements: 2.1, 2.2_

  - [x] 10.2 Implement debounced suggestion fetching

    - Debounce question text changes (500ms delay)
    - Trigger suggestion search after debounce
    - Cancel previous search if new text entered
    - _Requirements: 2.5_

  - [x] 10.3 Handle suggestion application

    - Allow student to mark suggestion as helpful
    - Optionally allow student to reference suggestion in ticket
    - Track which suggestions were viewed
    - _Requirements: 2.4, 4.1_

- [x] 11. Add knowledge management to instructor dashboard

  - [x] 11.1 Create knowledge base section in dashboard

    - Add "My Knowledge Base" card to instructor dashboard
    - Show summary statistics (total entries, total views, avg helpful %)
    - Add "Manage Entries" button linking to KnowledgeEntryManager
    - _Requirements: 3.1_

  - [x] 11.2 Add quick actions

    - Show recent entries (last 5)
    - Add quick edit/delete actions
    - Show entries needing attention (low helpful %)
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. Add navigation and routing

  - [x] 12.1 Add knowledge base routes

    - Add route for /knowledge-base (KnowledgeEntryManager page)
    - Add route protection for instructor role

    - Update navigation menu with knowledge base link
    - _Requirements: 3.1_

- [ ] 13. Performance optimization

  - [ ] 13.1 Implement caching for frequently accessed entries

    - Add React Query cache configuration for knowledge entries
    - Set appropriate stale time and cache time
    - Implement cache invalidation on updates
    - _Requirements: 2.5_

  - [ ] 13.2 Optimize vector search queries

    - Verify IVFFlat index is being used
    - Add query timeout (3 seconds)
    - Implement fallback for search failures
    - _Requirements: 2.5_

  - [ ] 13.3 Add loading states and skeletons
    - Add skeleton loaders for suggestion panel
    - Add skeleton loaders for entry list
    - Implement optimistic updates for feedback
    - _Requirements: 2.5_

- [ ] 14. Error handling and edge cases

  - [ ] 14.1 Handle embedding generation failures

    - Add retry logic with exponential backoff
    - Show user-friendly error message
    - Allow user to retry or save without embedding
    - _Requirements: 1.4, 2.1_

  - [ ] 14.2 Handle search failures gracefully

    - Don't block ticket creation if search fails
    - Show error message in suggestion panel
    - Provide retry button
    - _Requirements: 2.5_

  - [ ] 14.3 Handle duplicate feedback submissions
    - Catch unique constraint violations
    - Show message that feedback already submitted
    - Update UI to reflect existing feedback
    - _Requirements: 4.1, 4.2_

- [ ]\* 15. Testing

  - [ ]\* 15.1 Write unit tests for KnowledgeEntryService

    - Test createEntry with valid and invalid inputs
    - Test updateEntry versioning logic
    - Test deleteEntry authorization
    - Test getInstructorEntries filtering
    - _Requirements: 1.1, 1.2, 3.2, 3.3_

  - [ ]\* 15.2 Write unit tests for KnowledgeSuggestionService

    - Test findSimilarEntries with various similarity scores
    - Test visibility filtering logic
    - Test submitFeedback with duplicate handling
    - Test getEntryFeedbackStats calculations
    - _Requirements: 2.1, 2.2, 4.1, 4.4, 5.2_

  - [ ]\* 15.3 Write component tests for UI components

    - Test SaveToKnowledgeBaseDialog form validation
    - Test KnowledgeSuggestionCard feedback interaction
    - Test AutoSuggestionPanel loading and error states
    - Test KnowledgeEntryManager CRUD operations
    - _Requirements: 1.1, 2.3, 4.1, 3.1_

  - [ ]\* 15.4 Write integration tests
    - Test end-to-end flow: instructor saves answer, student gets suggestion
    - Test version history integrity
    - Test visibility rules enforcement
    - Test feedback statistics accuracy
    - _Requirements: 1.1, 2.1, 3.5, 4.5, 5.2_

- [ ]\* 16. Documentation

  - [ ]\* 16.1 Update service README

    - Document KnowledgeEntryService API
    - Document KnowledgeSuggestionService API
    - Add usage examples
    - _Requirements: All_

  - [ ]\* 16.2 Create user guide

    - Write guide for instructors on saving knowledge entries
    - Write guide for students on using suggestions
    - Add screenshots and examples
    - _Requirements: 1.1, 2.1_

  - [ ]\* 16.3 Update main README
    - Add knowledge base feature to feature list
    - Update architecture diagram
    - Add setup instructions for new tables
    - _Requirements: All_
