# Design Document: Knowledge Base Auto-Save

## Overview

This feature extends the existing RAG (Retrieval-Augmented Generation) system to enable instructors to save their ticket responses as reusable knowledge entries. When students create new tickets, the system automatically searches these entries and suggests relevant answers, creating a self-improving knowledge base that reduces repetitive questions.

The design leverages the existing `documents` table and vector search infrastructure, adding new tables for instructor-specific knowledge entries and student feedback tracking.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  TicketDetail Page    │  NewTicket Page  │  Knowledge Mgmt  │
│  - Save to KB option  │  - Auto-suggest  │  - View entries  │
│  - Edit before save   │  - View details  │  - Edit/Delete   │
│                       │  - Feedback      │                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│  KnowledgeEntryService    │  KnowledgeSuggestionService     │
│  - Create/Update/Delete   │  - Search similar questions     │
│  - Manage visibility      │  - Rank by relevance           │
│  - Version history        │  - Track feedback              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (Supabase)                  │
├─────────────────────────────────────────────────────────────┤
│  knowledge_entries        │  knowledge_feedback             │
│  - Question/Answer        │  - Helpful/Not helpful         │
│  - Embeddings (pgvector)  │  - Suggestion tracking         │
│  - Visibility control     │                                │
│  - Version history        │                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
├─────────────────────────────────────────────────────────────┤
│  Google Gemini API                                          │
│  - Generate embeddings (text-embedding-004, 768 dims)       │
│  - Semantic similarity search                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Knowledge Entry Creation Flow

```
Instructor answers ticket
    ↓
Clicks "Save to Knowledge Base" (optional)
    ↓
Edit dialog appears with question/answer pre-filled
    ↓
Instructor edits content, adds tags, sets visibility
    ↓
System generates embedding for question text
    ↓
Store in knowledge_entries table with metadata
    ↓
Confirmation feedback to instructor
```

#### 2. Auto-Suggestion Flow

```
Student creates new ticket with question
    ↓
System generates embedding for question text
    ↓
Vector similarity search in knowledge_entries
    ↓
Filter by visibility permissions (course-specific)
    ↓
Rank by similarity score (threshold: 0.7)
    ↓
Display top 3 suggestions to student
    ↓
Student views details and provides feedback
    ↓
Update feedback scores in knowledge_feedback table
```

## Components and Interfaces

### Database Schema

#### New Tables

**knowledge_entries**

```sql
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,

  -- Content
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Vector search
  question_embedding VECTOR(768),

  -- Visibility control
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public' | 'course_specific'
  course_code TEXT,

  -- Metadata
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Version history
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES knowledge_entries(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'course_specific')),
  CONSTRAINT course_required_for_specific CHECK (
    (visibility = 'course_specific' AND course_code IS NOT NULL) OR
    (visibility = 'public')
  )
);

-- Indexes for performance
CREATE INDEX idx_knowledge_entries_instructor ON knowledge_entries(instructor_id);
CREATE INDEX idx_knowledge_entries_course ON knowledge_entries(course_code) WHERE course_code IS NOT NULL;
CREATE INDEX idx_knowledge_entries_visibility ON knowledge_entries(visibility);
CREATE INDEX idx_knowledge_entries_embedding ON knowledge_entries
  USING ivfflat (question_embedding vector_cosine_ops);
```

**knowledge_feedback**

```sql
CREATE TABLE knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,

  -- Feedback
  is_helpful BOOLEAN NOT NULL,
  similarity_score FLOAT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(entry_id, student_id, ticket_id)
);

-- Indexes
CREATE INDEX idx_knowledge_feedback_entry ON knowledge_feedback(entry_id);
CREATE INDEX idx_knowledge_feedback_student ON knowledge_feedback(student_id);
```

**knowledge_suggestions**

```sql
CREATE TABLE knowledge_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,

  -- Ranking
  similarity_score FLOAT NOT NULL,
  rank_position INTEGER NOT NULL,

  -- Interaction tracking
  was_viewed BOOLEAN DEFAULT FALSE,
  was_helpful BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(ticket_id, entry_id)
);

-- Indexes
CREATE INDEX idx_knowledge_suggestions_ticket ON knowledge_suggestions(ticket_id);
CREATE INDEX idx_knowledge_suggestions_entry ON knowledge_suggestions(entry_id);
```

### Service Layer

#### KnowledgeEntryService

```typescript
export interface KnowledgeEntry {
  id: string;
  instructorId: string;
  ticketId?: string;
  questionText: string;
  answerText: string;
  tags: string[];
  visibility: "public" | "course_specific";
  courseCode?: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  version: number;
  previousVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeEntryInput {
  instructorId: string;
  ticketId?: string;
  questionText: string;
  answerText: string;
  tags?: string[];
  visibility: "public" | "course_specific";
  courseCode?: string;
}

export class KnowledgeEntryService {
  /**
   * Create a new knowledge entry with embedding
   */
  static async createEntry(
    input: CreateKnowledgeEntryInput
  ): Promise<KnowledgeEntry>;

  /**
   * Update an existing entry (creates new version)
   */
  static async updateEntry(
    entryId: string,
    updates: Partial<CreateKnowledgeEntryInput>
  ): Promise<KnowledgeEntry>;

  /**
   * Delete an entry (soft delete - mark as inactive)
   */
  static async deleteEntry(
    entryId: string,
    instructorId: string
  ): Promise<void>;

  /**
   * Get entries by instructor
   */
  static async getInstructorEntries(
    instructorId: string,
    filters?: {
      courseCode?: string;
      visibility?: string;
      searchTerm?: string;
    }
  ): Promise<KnowledgeEntry[]>;

  /**
   * Get entry version history
   */
  static async getVersionHistory(entryId: string): Promise<KnowledgeEntry[]>;

  /**
   * Update entry statistics (view count, helpful count)
   */
  static async updateStatistics(
    entryId: string,
    updates: {
      incrementViews?: boolean;
      incrementHelpful?: boolean;
      incrementNotHelpful?: boolean;
    }
  ): Promise<void>;
}
```

#### KnowledgeSuggestionService

```typescript
export interface KnowledgeSuggestion {
  entry: KnowledgeEntry;
  similarityScore: number;
  instructor: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface SuggestionFeedback {
  entryId: string;
  studentId: string;
  ticketId: string;
  isHelpful: boolean;
  similarityScore: number;
}

export class KnowledgeSuggestionService {
  /**
   * Find similar knowledge entries for a question
   */
  static async findSimilarEntries(
    questionText: string,
    studentCourseCode?: string,
    limit?: number
  ): Promise<KnowledgeSuggestion[]>;

  /**
   * Record suggestion display for a ticket
   */
  static async recordSuggestions(
    ticketId: string,
    suggestions: Array<{
      entryId: string;
      similarityScore: number;
      rank: number;
    }>
  ): Promise<void>;

  /**
   * Submit feedback on a suggestion
   */
  static async submitFeedback(feedback: SuggestionFeedback): Promise<void>;

  /**
   * Get suggestions for a specific ticket
   */
  static async getTicketSuggestions(
    ticketId: string
  ): Promise<KnowledgeSuggestion[]>;

  /**
   * Get feedback statistics for an entry
   */
  static async getEntryFeedbackStats(entryId: string): Promise<{
    totalFeedback: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulPercentage: number;
  }>;
}
```

### UI Components

#### SaveToKnowledgeBaseDialog

```typescript
interface SaveToKnowledgeBaseDialogProps {
  ticketId: string;
  questionText: string;
  answerText: string;
  courseCode?: string;
  onSave: (entry: KnowledgeEntry) => void;
  onCancel: () => void;
}

/**
 * Dialog for instructors to save ticket responses to knowledge base
 * Features:
 * - Editable question and answer fields
 * - Tag input with suggestions
 * - Visibility selector (public/course-specific)
 * - Preview of how it will appear to students
 */
```

#### KnowledgeSuggestionCard

```typescript
interface KnowledgeSuggestionCardProps {
  suggestion: KnowledgeSuggestion;
  onViewDetails: () => void;
  onFeedback: (isHelpful: boolean) => void;
  showFeedback: boolean;
}

/**
 * Card displaying a suggested knowledge entry
 * Features:
 * - Question preview with similarity indicator
 * - Answer preview (truncated)
 * - Instructor info with avatar
 * - Helpful/Not helpful buttons
 * - View full details button
 */
```

#### KnowledgeEntryManager

```typescript
interface KnowledgeEntryManagerProps {
  instructorId: string;
}

/**
 * Page for instructors to manage their knowledge entries
 * Features:
 * - List view with search and filters
 * - Statistics (views, helpful %, feedback count)
 * - Edit/Delete actions
 * - Version history viewer
 * - Bulk operations
 */
```

#### AutoSuggestionPanel

```typescript
interface AutoSuggestionPanelProps {
  ticketId: string;
  questionText: string;
  courseCode?: string;
  onSuggestionApplied?: (entryId: string) => void;
}

/**
 * Panel shown when creating a ticket with auto-suggestions
 * Features:
 * - Loading state while searching
 * - List of top 3 suggestions
 * - "No suggestions found" empty state
 * - Expandable details for each suggestion
 * - Feedback collection
 */
```

## Data Models

### TypeScript Interfaces

```typescript
// Database types (generated by Drizzle)
export type KnowledgeEntryVisibility = "public" | "course_specific";

export interface KnowledgeEntryRow {
  id: string;
  instructor_id: string;
  ticket_id: string | null;
  question_text: string;
  answer_text: string;
  tags: string[];
  question_embedding: string; // Vector as string
  visibility: KnowledgeEntryVisibility;
  course_code: string | null;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  version: number;
  previous_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFeedbackRow {
  id: string;
  entry_id: string;
  student_id: string;
  ticket_id: string | null;
  is_helpful: boolean;
  similarity_score: number | null;
  created_at: string;
}

export interface KnowledgeSuggestionRow {
  id: string;
  ticket_id: string;
  entry_id: string;
  similarity_score: number;
  rank_position: number;
  was_viewed: boolean;
  was_helpful: boolean | null;
  created_at: string;
}
```

## Error Handling

### Error Types

```typescript
export class KnowledgeBaseError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "KnowledgeBaseError";
  }
}

// Specific error codes
export const KB_ERROR_CODES = {
  EMBEDDING_FAILED: "KB_EMBEDDING_FAILED",
  INVALID_VISIBILITY: "KB_INVALID_VISIBILITY",
  UNAUTHORIZED: "KB_UNAUTHORIZED",
  ENTRY_NOT_FOUND: "KB_ENTRY_NOT_FOUND",
  DUPLICATE_FEEDBACK: "KB_DUPLICATE_FEEDBACK",
  SEARCH_FAILED: "KB_SEARCH_FAILED",
} as const;
```

### Error Handling Strategy

1. **Service Layer**: Catch and wrap database errors with meaningful messages
2. **UI Layer**: Display user-friendly error messages with retry options
3. **Logging**: Log all errors to console with context for debugging
4. **Fallback**: Gracefully degrade when suggestions fail (don't block ticket creation)

## Testing Strategy

### Unit Tests

```typescript
// KnowledgeEntryService tests
describe("KnowledgeEntryService", () => {
  test("createEntry generates embedding and stores entry", async () => {
    // Mock EmbeddingService
    // Create entry
    // Verify embedding was generated
    // Verify entry was stored with correct data
  });

  test("updateEntry creates new version", async () => {
    // Create initial entry
    // Update entry
    // Verify new version created
    // Verify previous_version_id links to old version
  });

  test("deleteEntry prevents unauthorized deletion", async () => {
    // Create entry as instructor A
    // Attempt delete as instructor B
    // Verify error thrown
  });
});

// KnowledgeSuggestionService tests
describe("KnowledgeSuggestionService", () => {
  test("findSimilarEntries respects visibility rules", async () => {
    // Create public and course-specific entries
    // Search as student in specific course
    // Verify only accessible entries returned
  });

  test("findSimilarEntries filters by similarity threshold", async () => {
    // Create entries with varying similarity
    // Search with threshold 0.7
    // Verify only entries above threshold returned
  });

  test("submitFeedback updates entry statistics", async () => {
    // Submit helpful feedback
    // Verify helpful_count incremented
    // Verify feedback record created
  });
});
```

### Integration Tests

```typescript
describe("Knowledge Base Integration", () => {
  test("end-to-end: instructor saves answer, student gets suggestion", async () => {
    // 1. Instructor answers ticket
    // 2. Saves to knowledge base
    // 3. Student creates similar ticket
    // 4. Verify suggestion appears
    // 5. Student marks as helpful
    // 6. Verify statistics updated
  });

  test("version history maintains integrity", async () => {
    // Create entry
    // Update multiple times
    // Verify version chain is correct
    // Verify all versions retrievable
  });
});
```

### UI Component Tests

```typescript
describe("SaveToKnowledgeBaseDialog", () => {
  test("pre-fills question and answer from ticket", () => {
    // Render with ticket data
    // Verify fields populated
  });

  test("validates required fields before save", () => {
    // Clear required field
    // Attempt save
    // Verify error message shown
  });

  test("shows course code field only for course-specific visibility", () => {
    // Select public visibility
    // Verify course field hidden
    // Select course-specific
    // Verify course field shown and required
  });
});

describe("AutoSuggestionPanel", () => {
  test("displays loading state while searching", () => {
    // Render with pending search
    // Verify loading indicator shown
  });

  test("displays suggestions sorted by similarity", () => {
    // Render with mock suggestions
    // Verify order matches similarity scores
  });

  test("records feedback when buttons clicked", () => {
    // Click helpful button
    // Verify service method called
    // Verify UI updated
  });
});
```

## Performance Considerations

### Database Optimization

1. **Vector Index**: Use IVFFlat index on `question_embedding` for fast similarity search
2. **Composite Indexes**: Index combinations of frequently queried fields (instructor_id + course_code)
3. **Materialized Views**: Consider for frequently accessed statistics

### Caching Strategy

```typescript
// Cache frequently accessed entries
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class KnowledgeEntryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
```

### Embedding Generation

- **Batch Processing**: Generate embeddings in batches when possible
- **Rate Limiting**: Respect Gemini API rate limits (5 requests/second)
- **Retry Logic**: Implement exponential backoff for failed requests

### Search Optimization

```typescript
// Limit search scope for better performance
const SIMILARITY_THRESHOLD = 0.7; // Only return entries above 70% similarity
const MAX_RESULTS = 3; // Limit to top 3 suggestions
const SEARCH_TIMEOUT = 3000; // 3 second timeout
```

## Security Considerations

### Access Control

1. **Entry Creation**: Only instructors can create knowledge entries
2. **Entry Modification**: Only the creator can edit/delete their entries
3. **Visibility Enforcement**: Database-level checks ensure students only see permitted entries
4. **Feedback Submission**: Only students can submit feedback, only once per entry per ticket

### Data Validation

```typescript
// Input sanitization
const sanitizeKnowledgeEntry = (input: CreateKnowledgeEntryInput) => {
  return {
    ...input,
    questionText: input.questionText.trim().slice(0, 2000),
    answerText: input.answerText.trim().slice(0, 10000),
    tags: input.tags?.slice(0, 10).map((tag) => tag.trim().slice(0, 50)),
    courseCode: input.courseCode?.trim().toUpperCase(),
  };
};
```

### SQL Injection Prevention

- Use parameterized queries via Drizzle ORM
- Never concatenate user input into SQL strings
- Validate all input types and formats

## Migration Strategy

### Phase 1: Database Setup

1. Create new tables with indexes
2. Add RLS policies for access control
3. Test with sample data

### Phase 2: Service Layer

1. Implement KnowledgeEntryService
2. Implement KnowledgeSuggestionService
3. Add comprehensive error handling

### Phase 3: UI Components

1. Build SaveToKnowledgeBaseDialog
2. Build AutoSuggestionPanel
3. Build KnowledgeEntryManager

### Phase 4: Integration

1. Integrate save option into TicketDetail page
2. Integrate auto-suggestions into NewTicket page
3. Add knowledge management to instructor dashboard

### Phase 5: Testing & Optimization

1. Run full test suite
2. Performance testing with large datasets
3. User acceptance testing
4. Optimize based on feedback

## Future Enhancements

1. **AI-Powered Improvements**

   - Automatically suggest tags based on content
   - Detect duplicate entries
   - Recommend merging similar entries

2. **Advanced Analytics**

   - Track which entries reduce ticket volume
   - Identify knowledge gaps
   - Instructor leaderboards

3. **Collaborative Features**

   - Allow instructors to share entries
   - Peer review system
   - Community voting on best answers

4. **Multi-language Support**

   - Translate entries to student's preferred language
   - Cross-language similarity search

5. **Integration with RAG Assistant**
   - Use knowledge entries as additional context
   - Chatbot can reference instructor-created entries
   - Seamless handoff from bot to human instructor
