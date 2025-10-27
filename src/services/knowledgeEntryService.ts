/**
 * KnowledgeEntryService - Manage knowledge base entries
 * Handles CRUD operations for instructor-created knowledge entries
 */

// @ts-nocheck - Supabase type inference issues with complex queries
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { EmbeddingService } from "./embeddingService";

// Type aliases for knowledge entries
export type KnowledgeEntry = Database['public']['Tables']['knowledge_entries']['Row'];
type NewKnowledgeEntry = Database['public']['Tables']['knowledge_entries']['Insert'];

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CreateKnowledgeEntryInput {
    instructorId: string;
    ticketId?: string;
    questionText: string;
    answerText: string;
    tags?: string[];
    visibility: "public" | "course_specific";
    courseCode?: string;
}

export interface UpdateKnowledgeEntryInput {
    questionText?: string;
    answerText?: string;
    tags?: string[];
    visibility?: "public" | "course_specific";
    courseCode?: string;
}

export interface KnowledgeEntryFilters {
    courseCode?: string;
    visibility?: "public" | "course_specific";
    searchTerm?: string;
}

export interface StatisticsUpdate {
    incrementViews?: boolean;
    incrementHelpful?: boolean;
    incrementNotHelpful?: boolean;
}

// ============================================================================
// Error Handling
// ============================================================================

export class KnowledgeBaseError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = "KnowledgeBaseError";
    }
}

export const KB_ERROR_CODES = {
    EMBEDDING_FAILED: "KB_EMBEDDING_FAILED",
    INVALID_VISIBILITY: "KB_INVALID_VISIBILITY",
    UNAUTHORIZED: "KB_UNAUTHORIZED",
    ENTRY_NOT_FOUND: "KB_ENTRY_NOT_FOUND",
    DUPLICATE_FEEDBACK: "KB_DUPLICATE_FEEDBACK",
    SEARCH_FAILED: "KB_SEARCH_FAILED",
    VALIDATION_FAILED: "KB_VALIDATION_FAILED",
    DATABASE_ERROR: "KB_DATABASE_ERROR",
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

function validateCreateInput(input: CreateKnowledgeEntryInput): void {
    if (!input.instructorId?.trim()) {
        throw new KnowledgeBaseError(
            "Instructor ID is required",
            KB_ERROR_CODES.VALIDATION_FAILED
        );
    }

    if (!input.questionText?.trim()) {
        throw new KnowledgeBaseError(
            "Question text is required",
            KB_ERROR_CODES.VALIDATION_FAILED
        );
    }

    if (!input.answerText?.trim()) {
        throw new KnowledgeBaseError(
            "Answer text is required",
            KB_ERROR_CODES.VALIDATION_FAILED
        );
    }

    if (input.visibility === "course_specific" && !input.courseCode?.trim()) {
        throw new KnowledgeBaseError(
            "Course code is required for course-specific visibility",
            KB_ERROR_CODES.INVALID_VISIBILITY
        );
    }

    if (input.questionText.length > 2000) {
        throw new KnowledgeBaseError(
            "Question text must be 2000 characters or less",
            KB_ERROR_CODES.VALIDATION_FAILED
        );
    }

    if (input.answerText.length > 10000) {
        throw new KnowledgeBaseError(
            "Answer text must be 10000 characters or less",
            KB_ERROR_CODES.VALIDATION_FAILED
        );
    }
}

function sanitizeInput(input: CreateKnowledgeEntryInput): CreateKnowledgeEntryInput {
    return {
        ...input,
        questionText: input.questionText.trim().slice(0, 2000),
        answerText: input.answerText.trim().slice(0, 10000),
        tags: input.tags?.slice(0, 10).map((tag) => tag.trim().slice(0, 50)),
        courseCode: input.courseCode?.trim().toUpperCase(),
    };
}

// ============================================================================
// KnowledgeEntryService
// ============================================================================

export class KnowledgeEntryService {
    /**
     * Create a new knowledge entry with embedding
     */
    static async createEntry(
        input: CreateKnowledgeEntryInput
    ): Promise<KnowledgeEntry> {
        try {
            // Validate input
            validateCreateInput(input);

            // Sanitize input
            const sanitizedInput = sanitizeInput(input);

            // Generate embedding for question text
            let embedding: number[] | null = null;
            try {
                embedding = await EmbeddingService.generateEmbedding(
                    sanitizedInput.questionText
                );
            } catch (error: any) {
                console.error("Failed to generate embedding:", error);
                throw new KnowledgeBaseError(
                    `Failed to generate embedding: ${error.message}`,
                    KB_ERROR_CODES.EMBEDDING_FAILED,
                    { originalError: error }
                );
            }

            // Prepare entry data
            const entryData = {
                instructor_id: sanitizedInput.instructorId,
                ticket_id: sanitizedInput.ticketId || null,
                question_text: sanitizedInput.questionText,
                answer_text: sanitizedInput.answerText,
                tags: sanitizedInput.tags || [],
                question_embedding: embedding ? JSON.stringify(embedding) : null,
                visibility: sanitizedInput.visibility,
                course_code: sanitizedInput.courseCode || null,
                view_count: 0,
                helpful_count: 0,
                not_helpful_count: 0,
                version: 1,
                previous_version_id: null,
            };

            // Insert into database
            // @ts-expect-error - Supabase type inference issue with insert
            const { data: createdEntry, error } = await supabase
                .from('knowledge_entries')
                .insert(entryData)
                .select()
                .single();

            if (error || !createdEntry) {
                throw new KnowledgeBaseError(
                    `Failed to create knowledge entry: ${error?.message || 'Unknown error'}`,
                    KB_ERROR_CODES.DATABASE_ERROR
                );
            }

            return createdEntry;
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error creating knowledge entry:", error);
            throw new KnowledgeBaseError(
                `Failed to create knowledge entry: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Update an existing entry (creates new version)
     */
    static async updateEntry(
        entryId: string,
        instructorId: string,
        updates: UpdateKnowledgeEntryInput
    ): Promise<KnowledgeEntry> {
        try {
            // Fetch the existing entry
            const { data: existingEntry, error: fetchError } = await supabase
                .from('knowledge_entries')
                .select()
                .eq('id', entryId)
                .single();

            if (fetchError || !existingEntry) {
                throw new KnowledgeBaseError(
                    "Knowledge entry not found",
                    KB_ERROR_CODES.ENTRY_NOT_FOUND
                );
            }

            // Verify ownership
            if (existingEntry.instructor_id !== instructorId) {
                throw new KnowledgeBaseError(
                    "Unauthorized: You can only update your own entries",
                    KB_ERROR_CODES.UNAUTHORIZED
                );
            }

            // Validate visibility and course code
            const newVisibility = updates.visibility || existingEntry.visibility;
            const newCourseCode = updates.courseCode !== undefined
                ? updates.courseCode
                : existingEntry.course_code;

            if (newVisibility === "course_specific" && !newCourseCode?.trim()) {
                throw new KnowledgeBaseError(
                    "Course code is required for course-specific visibility",
                    KB_ERROR_CODES.INVALID_VISIBILITY
                );
            }

            // Prepare updated data
            const questionText = updates.questionText?.trim() || existingEntry.question_text;
            const answerText = updates.answerText?.trim() || existingEntry.answer_text;
            const tags = updates.tags !== undefined ? updates.tags : existingEntry.tags;

            // Generate new embedding if question text changed
            let questionEmbedding = existingEntry.question_embedding;
            if (updates.questionText && updates.questionText.trim() !== existingEntry.question_text) {
                try {
                    const embedding = await EmbeddingService.generateEmbedding(questionText);
                    questionEmbedding = embedding;
                } catch (error: any) {
                    console.error("Failed to generate embedding:", error);
                    throw new KnowledgeBaseError(
                        `Failed to generate embedding: ${error.message}`,
                        KB_ERROR_CODES.EMBEDDING_FAILED,
                        { originalError: error }
                    );
                }
            }

            // Create new version
            const newVersionData = {
                instructor_id: existingEntry.instructor_id,
                ticket_id: existingEntry.ticket_id,
                question_text: questionText.slice(0, 2000),
                answer_text: answerText.slice(0, 10000),
                tags: tags?.slice(0, 10).map((tag) => tag.trim().slice(0, 50)) || [],
                question_embedding: typeof questionEmbedding === 'string' ? questionEmbedding : (questionEmbedding ? JSON.stringify(questionEmbedding) : null),
                visibility: newVisibility,
                course_code: newCourseCode?.trim().toUpperCase() || null,
                view_count: existingEntry.view_count,
                helpful_count: existingEntry.helpful_count,
                not_helpful_count: existingEntry.not_helpful_count,
                version: existingEntry.version + 1,
                previous_version_id: existingEntry.id,
            };

            // Insert new version
            const { data: newVersion, error: insertError } = await supabase
                .from('knowledge_entries')
                .insert(newVersionData)
                .select()
                .single();

            if (insertError || !newVersion) {
                throw new KnowledgeBaseError(
                    `Failed to create new version: ${insertError?.message || 'Unknown error'}`,
                    KB_ERROR_CODES.DATABASE_ERROR
                );
            }

            return newVersion;
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error updating knowledge entry:", error);
            throw new KnowledgeBaseError(
                `Failed to update knowledge entry: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Delete an entry
     */
    static async deleteEntry(
        entryId: string,
        instructorId: string
    ): Promise<void> {
        try {
            // Fetch the existing entry
            const { data: existingEntry, error: fetchError } = await supabase
                .from('knowledge_entries')
                .select()
                .eq('id', entryId)
                .single();

            if (fetchError || !existingEntry) {
                throw new KnowledgeBaseError(
                    "Knowledge entry not found",
                    KB_ERROR_CODES.ENTRY_NOT_FOUND
                );
            }

            // Verify ownership
            if (existingEntry.instructor_id !== instructorId) {
                throw new KnowledgeBaseError(
                    "Unauthorized: You can only delete your own entries",
                    KB_ERROR_CODES.UNAUTHORIZED
                );
            }

            // Delete the entry (cascade will handle related records)
            const { error: deleteError } = await supabase
                .from('knowledge_entries')
                .delete()
                .eq('id', entryId);

            if (deleteError) {
                throw new KnowledgeBaseError(
                    `Failed to delete entry: ${deleteError.message}`,
                    KB_ERROR_CODES.DATABASE_ERROR
                );
            }

        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error deleting knowledge entry:", error);
            throw new KnowledgeBaseError(
                `Failed to delete knowledge entry: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Get entries by instructor
     */
    static async getInstructorEntries(
        instructorId: string,
        filters?: KnowledgeEntryFilters
    ): Promise<KnowledgeEntry[]> {
        try {
            // Start building query
            let query = supabase
                .from('knowledge_entries')
                .select()
                .eq('instructor_id', instructorId);

            // Apply filters
            if (filters?.courseCode) {
                query = query.eq('course_code', filters.courseCode.toUpperCase());
            }

            if (filters?.visibility) {
                query = query.eq('visibility', filters.visibility);
            }

            if (filters?.searchTerm) {
                // Supabase uses ilike for case-insensitive search
                query = query.or(`question_text.ilike.%${filters.searchTerm}%,answer_text.ilike.%${filters.searchTerm}%`);
            }

            // Execute query with ordering
            const { data: entries, error } = await query.order('updated_at', { ascending: false });

            if (error) {
                throw new KnowledgeBaseError(
                    `Failed to fetch entries: ${error.message}`,
                    KB_ERROR_CODES.DATABASE_ERROR
                );
            }

            return entries || [];
        } catch (error: any) {
            console.error("Error fetching instructor entries:", error);
            throw new KnowledgeBaseError(
                `Failed to fetch instructor entries: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Get entry version history
     */
    static async getVersionHistory(entryId: string): Promise<KnowledgeEntry[]> {
        try {
            // Fetch the current entry
            const { data: currentEntry, error: fetchError } = await supabase
                .from('knowledge_entries')
                .select()
                .eq('id', entryId)
                .single();

            if (fetchError || !currentEntry) {
                throw new KnowledgeBaseError(
                    "Knowledge entry not found",
                    KB_ERROR_CODES.ENTRY_NOT_FOUND
                );
            }

            // Collect all versions by following the previousVersionId chain
            const versions: KnowledgeEntry[] = [currentEntry];
            let currentVersionId = currentEntry.previous_version_id;

            while (currentVersionId) {
                const { data: previousVersion, error } = await supabase
                    .from('knowledge_entries')
                    .select()
                    .eq('id', currentVersionId)
                    .single();

                if (error || !previousVersion) {
                    // Chain is broken, stop here
                    break;
                }

                versions.push(previousVersion);
                currentVersionId = previousVersion.previous_version_id;
            }

            // Sort by version number (newest first)
            versions.sort((a, b) => b.version - a.version);

            return versions;
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error fetching version history:", error);
            throw new KnowledgeBaseError(
                `Failed to fetch version history: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Update entry statistics (view count, helpful count)
     */
    static async updateStatistics(
        entryId: string,
        updates: StatisticsUpdate
    ): Promise<void> {
        try {
            // Fetch current entry to get current counts
            const { data: currentEntry, error: fetchError } = await supabase
                .from('knowledge_entries')
                .select('view_count, helpful_count, not_helpful_count')
                .eq('id', entryId)
                .single();

            if (fetchError || !currentEntry) {
                throw new KnowledgeBaseError(
                    "Knowledge entry not found",
                    KB_ERROR_CODES.ENTRY_NOT_FOUND
                );
            }

            // Build update object with incremented values
            const updateData: Partial<Record<string, any>> = {};

            if (updates.incrementViews) {
                updateData.view_count = currentEntry.view_count + 1;
            }

            if (updates.incrementHelpful) {
                updateData.helpful_count = currentEntry.helpful_count + 1;
            }

            if (updates.incrementNotHelpful) {
                updateData.not_helpful_count = currentEntry.not_helpful_count + 1;
            }

            // Only update if there are changes
            if (Object.keys(updateData).length === 0) {
                return;
            }

            // Update the entry
            const { error: updateError } = await supabase
                .from('knowledge_entries')
                .update(updateData)
                .eq('id', entryId);

            if (updateError) {
                throw new KnowledgeBaseError(
                    `Failed to update statistics: ${updateError.message}`,
                    KB_ERROR_CODES.DATABASE_ERROR
                );
            }

        } catch (error: any) {
            console.error("Error updating statistics:", error);
            throw new KnowledgeBaseError(
                `Failed to update statistics: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }
}
