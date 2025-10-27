/**
 * KnowledgeSuggestionService - Manage knowledge base suggestions and feedback
 * Handles searching for similar entries, recording suggestions, and tracking feedback
 */

import { db } from "@/db/client";
import {
    knowledgeEntries,
    knowledgeFeedback,
    knowledgeSuggestions,
    profiles,
    type KnowledgeEntry,
    type NewKnowledgeFeedback,
    type NewKnowledgeSuggestion,
} from "@/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { EmbeddingService } from "./embeddingService";
import { KB_ERROR_CODES, KnowledgeBaseError, KnowledgeEntryService } from "./knowledgeEntryService";

// ============================================================================
// Constants
// ============================================================================

const SIMILARITY_THRESHOLD = 0.7; // Minimum similarity score (70%)
const MAX_RESULTS = 3; // Maximum number of suggestions to return
const SEARCH_TIMEOUT = 3000; // Search timeout in milliseconds

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface KnowledgeSuggestion {
    entry: KnowledgeEntry;
    similarityScore: number;
    instructor: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
    };
}

export interface SuggestionFeedback {
    entryId: string;
    studentId: string;
    ticketId: string;
    isHelpful: boolean;
    similarityScore: number;
}

export interface RecordSuggestionInput {
    entryId: string;
    similarityScore: number;
    rank: number;
}

export interface FeedbackStats {
    totalFeedback: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulPercentage: number;
}

// ============================================================================
// KnowledgeSuggestionService
// ============================================================================

export class KnowledgeSuggestionService {
    /**
     * Find similar knowledge entries for a question
     */
    static async findSimilarEntries(
        questionText: string,
        studentCourseCode?: string,
        limit: number = MAX_RESULTS
    ): Promise<KnowledgeSuggestion[]> {
        try {
            // Validate input
            if (!questionText?.trim()) {
                throw new KnowledgeBaseError(
                    "Question text is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            // Generate embedding for the question
            let questionEmbedding: number[];
            try {
                questionEmbedding = await EmbeddingService.generateEmbedding(
                    questionText.trim()
                );
            } catch (error: any) {
                console.error("Failed to generate embedding for search:", error);
                throw new KnowledgeBaseError(
                    `Failed to generate embedding: ${error.message}`,
                    KB_ERROR_CODES.EMBEDDING_FAILED,
                    { originalError: error }
                );
            }

            // Convert embedding to pgvector format string
            const embeddingString = `[${questionEmbedding.join(",")}]`;

            // Build visibility filter conditions
            // Students can see: public entries OR course-specific entries matching their course
            const visibilityConditions = studentCourseCode
                ? or(
                    eq(knowledgeEntries.visibility, "public"),
                    and(
                        eq(knowledgeEntries.visibility, "course_specific"),
                        eq(knowledgeEntries.courseCode, studentCourseCode.toUpperCase())
                    )
                )
                : eq(knowledgeEntries.visibility, "public");

            // Perform vector similarity search with timeout
            const searchPromise = db
                .select({
                    entry: knowledgeEntries,
                    instructor: {
                        id: profiles.id,
                        fullName: profiles.fullName,
                        avatarUrl: profiles.avatarUrl,
                    },
                    similarityScore: sql<number>`1 - (${knowledgeEntries.questionEmbedding} <=> ${embeddingString}::vector)`,
                })
                .from(knowledgeEntries)
                .innerJoin(profiles, eq(knowledgeEntries.instructorId, profiles.id))
                .where(
                    and(
                        visibilityConditions!,
                        // Filter by similarity threshold using cosine distance
                        sql`1 - (${knowledgeEntries.questionEmbedding} <=> ${embeddingString}::vector) >= ${SIMILARITY_THRESHOLD}`
                    )
                )
                .orderBy(
                    desc(
                        sql`1 - (${knowledgeEntries.questionEmbedding} <=> ${embeddingString}::vector)`
                    )
                )
                .limit(limit);

            // Add timeout to search
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error("Search timeout exceeded")),
                    SEARCH_TIMEOUT
                )
            );

            const results = await Promise.race([searchPromise, timeoutPromise]);

            // Transform results to KnowledgeSuggestion format
            const suggestions: KnowledgeSuggestion[] = results.map((row) => ({
                entry: row.entry,
                similarityScore: row.similarityScore,
                instructor: row.instructor,
            }));

            return suggestions;
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error finding similar entries:", error);
            throw new KnowledgeBaseError(
                `Failed to search knowledge base: ${error.message}`,
                KB_ERROR_CODES.SEARCH_FAILED,
                { originalError: error }
            );
        }
    }

    /**
     * Record suggestion display for a ticket
     */
    static async recordSuggestions(
        ticketId: string,
        suggestions: RecordSuggestionInput[]
    ): Promise<void> {
        try {
            // Validate input
            if (!ticketId?.trim()) {
                throw new KnowledgeBaseError(
                    "Ticket ID is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            if (!suggestions || suggestions.length === 0) {
                return; // Nothing to record
            }

            // Prepare suggestion records
            const suggestionRecords: NewKnowledgeSuggestion[] = suggestions.map(
                (suggestion) => ({
                    ticketId,
                    entryId: suggestion.entryId,
                    similarityScore: Math.round(suggestion.similarityScore * 100), // Store as integer percentage
                    rankPosition: suggestion.rank,
                    wasViewed: false,
                    wasHelpful: null,
                })
            );

            // Insert suggestions, handling duplicates gracefully
            // Using onConflictDoNothing to avoid errors on duplicate ticket_id + entry_id
            for (const record of suggestionRecords) {
                try {
                    await db
                        .insert(knowledgeSuggestions)
                        .values(record)
                        .onConflictDoNothing();
                } catch (error: any) {
                    // Log but don't fail - duplicate suggestions are acceptable
                    console.warn(
                        `Failed to record suggestion for ticket ${ticketId}, entry ${record.entryId}:`,
                        error.message
                    );
                }
            }
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error recording suggestions:", error);
            throw new KnowledgeBaseError(
                `Failed to record suggestions: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Submit feedback on a suggestion
     */
    static async submitFeedback(feedback: SuggestionFeedback): Promise<void> {
        try {
            // Validate input
            if (!feedback.entryId?.trim()) {
                throw new KnowledgeBaseError(
                    "Entry ID is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            if (!feedback.studentId?.trim()) {
                throw new KnowledgeBaseError(
                    "Student ID is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            if (!feedback.ticketId?.trim()) {
                throw new KnowledgeBaseError(
                    "Ticket ID is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            // Prepare feedback record
            const feedbackRecord: NewKnowledgeFeedback = {
                entryId: feedback.entryId,
                studentId: feedback.studentId,
                ticketId: feedback.ticketId,
                isHelpful: feedback.isHelpful,
                similarityScore: Math.round(feedback.similarityScore * 100), // Store as integer percentage
            };

            // Insert feedback, handling duplicate constraint
            try {
                await db
                    .insert(knowledgeFeedback)
                    .values(feedbackRecord)
                    .onConflictDoNothing(); // Unique constraint on (entry_id, student_id, ticket_id)
            } catch (error: any) {
                // Check if it's a duplicate feedback error
                if (error.code === "23505" || error.message?.includes("unique")) {
                    throw new KnowledgeBaseError(
                        "Feedback already submitted for this entry",
                        KB_ERROR_CODES.DUPLICATE_FEEDBACK
                    );
                }
                throw error;
            }

            // Update entry statistics
            await KnowledgeEntryService.updateStatistics(feedback.entryId, {
                incrementHelpful: feedback.isHelpful,
                incrementNotHelpful: !feedback.isHelpful,
            });
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error submitting feedback:", error);
            throw new KnowledgeBaseError(
                `Failed to submit feedback: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Get suggestions for a specific ticket
     */
    static async getTicketSuggestions(
        ticketId: string
    ): Promise<KnowledgeSuggestion[]> {
        try {
            // Validate input
            if (!ticketId?.trim()) {
                throw new KnowledgeBaseError(
                    "Ticket ID is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            // Fetch suggestions for the ticket with entry and instructor details
            const results = await db
                .select({
                    suggestion: knowledgeSuggestions,
                    entry: knowledgeEntries,
                    instructor: {
                        id: profiles.id,
                        fullName: profiles.fullName,
                        avatarUrl: profiles.avatarUrl,
                    },
                })
                .from(knowledgeSuggestions)
                .innerJoin(
                    knowledgeEntries,
                    eq(knowledgeSuggestions.entryId, knowledgeEntries.id)
                )
                .innerJoin(
                    profiles,
                    eq(knowledgeEntries.instructorId, profiles.id)
                )
                .where(eq(knowledgeSuggestions.ticketId, ticketId))
                .orderBy(knowledgeSuggestions.rankPosition);

            // Transform results to KnowledgeSuggestion format
            const suggestions: KnowledgeSuggestion[] = results.map((row) => ({
                entry: row.entry,
                similarityScore: row.suggestion.similarityScore / 100, // Convert from integer percentage to decimal
                instructor: row.instructor,
            }));

            return suggestions;
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error fetching ticket suggestions:", error);
            throw new KnowledgeBaseError(
                `Failed to fetch ticket suggestions: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }

    /**
     * Get feedback statistics for an entry
     */
    static async getEntryFeedbackStats(entryId: string): Promise<FeedbackStats> {
        try {
            // Validate input
            if (!entryId?.trim()) {
                throw new KnowledgeBaseError(
                    "Entry ID is required",
                    KB_ERROR_CODES.VALIDATION_FAILED
                );
            }

            // Fetch all feedback for the entry
            const feedbackRecords = await db
                .select()
                .from(knowledgeFeedback)
                .where(eq(knowledgeFeedback.entryId, entryId));

            // Calculate statistics
            const totalFeedback = feedbackRecords.length;
            const helpfulCount = feedbackRecords.filter((f) => f.isHelpful).length;
            const notHelpfulCount = feedbackRecords.filter((f) => !f.isHelpful).length;
            const helpfulPercentage =
                totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

            return {
                totalFeedback,
                helpfulCount,
                notHelpfulCount,
                helpfulPercentage,
            };
        } catch (error: any) {
            if (error instanceof KnowledgeBaseError) {
                throw error;
            }

            console.error("Error fetching feedback stats:", error);
            throw new KnowledgeBaseError(
                `Failed to fetch feedback statistics: ${error.message}`,
                KB_ERROR_CODES.DATABASE_ERROR,
                { originalError: error }
            );
        }
    }
}
