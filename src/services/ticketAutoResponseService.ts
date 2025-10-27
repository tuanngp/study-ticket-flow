/**
 * TicketAutoResponseService - AI tự động gợi ý câu trả lời cho ticket
 * Sử dụng vector search trong knowledge base và RAG documents
 */

import { supabase } from '@/integrations/supabase/client';
import { AIAnswerService } from './aiAnswerService';
import { EmbeddingService } from './embeddingService';

export interface SuggestedAnswer {
    id: string;
    source: 'knowledge_base' | 'rag_documents';
    questionText: string;
    answerText: string;
    similarityScore: number;
    confidence: 'high' | 'medium' | 'low';
    metadata?: {
        instructorName?: string;
        instructorAvatar?: string;
        courseCode?: string;
        tags?: string[];
        viewCount?: number;
        helpfulCount?: number;
        chunkCount?: number;
    };
}

export interface AutoResponseResult {
    success: boolean;
    suggestions: SuggestedAnswer[];
    error?: string;
}

export class TicketAutoResponseService {
    private static readonly SIMILARITY_THRESHOLD = 0.7;
    private static readonly MAX_SUGGESTIONS = 3;

    /**
     * Tự động tìm câu trả lời gợi ý cho ticket
     */
    static async getSuggestedAnswers(
        ticketId: string,
        ticketTitle: string,
        ticketDescription: string,
        courseCode?: string
    ): Promise<AutoResponseResult> {
        try {
            const queryText = `${ticketTitle}\n${ticketDescription}`;
            const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);

            const [kbResults, ragResults] = await Promise.all([
                this.searchKnowledgeBase(queryEmbedding, courseCode),
                this.searchRAGDocuments(queryEmbedding, queryText)
            ]);

            const allSuggestions = [...kbResults, ...ragResults]
                .sort((a, b) => b.similarityScore - a.similarityScore)
                .slice(0, this.MAX_SUGGESTIONS);

            if (allSuggestions.length > 0) {
                await this.saveSuggestions(ticketId, allSuggestions);
            }

            return {
                success: true,
                suggestions: allSuggestions
            };
        } catch (error: any) {
            console.error('Error getting suggested answers:', error);
            return {
                success: false,
                suggestions: [],
                error: error.message
            };
        }
    }

    /**
     * Tìm kiếm trong knowledge base
     */
    private static async searchKnowledgeBase(
        queryEmbedding: number[],
        courseCode?: string
    ): Promise<SuggestedAnswer[]> {
        try {
            const { data, error } = await supabase.rpc('match_knowledge_entries', {
                query_embedding: JSON.stringify(queryEmbedding),
                match_threshold: this.SIMILARITY_THRESHOLD,
                match_count: this.MAX_SUGGESTIONS,
                filter_course_code: courseCode || null
            });

            if (error) {
                console.error('Knowledge base search error:', error);
                return [];
            }

            if (!data || !Array.isArray(data) || data.length === 0) {
                return [];
            }

            return data.map((entry: any) => ({
                id: entry.id,
                source: 'knowledge_base' as const,
                questionText: entry.question_text,
                answerText: entry.answer_text,
                similarityScore: entry.similarity,
                confidence: this.calculateConfidence(entry.similarity),
                metadata: {
                    instructorName: entry.instructor_name,
                    instructorAvatar: entry.instructor_avatar,
                    courseCode: entry.course_code,
                    tags: entry.tags || [],
                    viewCount: entry.view_count || 0,
                    helpfulCount: entry.helpful_count || 0
                }
            }));
        } catch (error) {
            console.error('Knowledge base search failed:', error);
            return [];
        }
    }

    /**
     * Tìm kiếm trong RAG documents và tổng hợp bằng AI
     */
    private static async searchRAGDocuments(
        queryEmbedding: number[],
        questionText?: string
    ): Promise<SuggestedAnswer[]> {
        try {
            const { data, error } = await supabase.rpc('match_documents', {
                query_embedding: JSON.stringify(queryEmbedding),
                match_threshold: this.SIMILARITY_THRESHOLD,
                match_count: this.MAX_SUGGESTIONS
            });

            if (error) {
                console.error('RAG documents search error:', error);
                return [];
            }

            if (!data || !Array.isArray(data) || data.length === 0) {
                return [];
            }

            // Tổng hợp câu trả lời bằng AI cho mỗi document
            const suggestions = await Promise.all(
                data.map(async (doc: any) => {
                    let answerText = doc.content;

                    // Nếu có nhiều chunks, dùng AI để tổng hợp
                    if (questionText && doc.chunk_count > 1) {
                        const aiResult = await AIAnswerService.generateAnswer({
                            question: questionText,
                            context: doc.content
                        });

                        // Chỉ dùng AI answer nếu chất lượng tốt
                        if (aiResult.success && aiResult.answer &&
                            AIAnswerService.isQualityAnswer(aiResult.answer)) {
                            answerText = aiResult.answer;
                        }
                    }

                    return {
                        id: doc.id,
                        source: 'rag_documents' as const,
                        questionText: doc.title,
                        answerText: answerText,
                        similarityScore: doc.similarity,
                        confidence: this.calculateConfidence(doc.similarity),
                        metadata: {
                            tags: doc.metadata?.tags || [],
                            chunkCount: doc.chunk_count
                        }
                    };
                })
            );

            return suggestions;
        } catch (error) {
            console.error('RAG documents search failed:', error);
            return [];
        }
    }

    /**
     * Tính toán confidence level
     */
    private static calculateConfidence(similarity: number): 'high' | 'medium' | 'low' {
        if (similarity >= 0.85) return 'high';
        if (similarity >= 0.75) return 'medium';
        return 'low';
    }

    /**
     * Lưu suggestions vào database
     */
    private static async saveSuggestions(
        ticketId: string,
        suggestions: SuggestedAnswer[]
    ): Promise<void> {
        try {
            const kbSuggestions = suggestions
                .filter(s => s.source === 'knowledge_base')
                .map((suggestion, index) => ({
                    ticket_id: ticketId,
                    entry_id: suggestion.id,
                    similarity_score: Math.round(suggestion.similarityScore * 100),
                    rank_position: index + 1,
                    was_viewed: false
                }));

            if (kbSuggestions.length > 0) {
                await supabase.from('knowledge_suggestions').insert(kbSuggestions as any);
            }
        } catch (error) {
            console.error('Failed to save suggestions:', error);
        }
    }

    /**
     * Đánh dấu suggestion đã được xem
     */
    static async markSuggestionViewed(
        ticketId: string,
        entryId: string
    ): Promise<void> {
        try {
            await supabase
                .from('knowledge_suggestions')
                .update({ was_viewed: true } as any)
                .match({ ticket_id: ticketId, entry_id: entryId } as any);
        } catch (error) {
            console.error('Failed to mark suggestion viewed:', error);
        }
    }

    /**
     * Đánh giá suggestion
     */
    static async rateSuggestion(
        ticketId: string,
        entryId: string,
        isHelpful: boolean,
        studentId: string
    ): Promise<void> {
        try {
            await supabase
                .from('knowledge_suggestions')
                .update({ was_helpful: isHelpful } as any)
                .match({ ticket_id: ticketId, entry_id: entryId } as any);

            await supabase.from('knowledge_feedback').insert({
                entry_id: entryId,
                student_id: studentId,
                ticket_id: ticketId,
                is_helpful: isHelpful
            } as any);

            if (isHelpful) {
                await supabase.rpc('increment_helpful_count', { entry_id: entryId });
            } else {
                await supabase.rpc('increment_not_helpful_count', { entry_id: entryId });
            }
        } catch (error) {
            console.error('Failed to rate suggestion:', error);
        }
    }

    /**
     * Lấy suggestions đã lưu
     */
    static async getSavedSuggestions(ticketId: string): Promise<SuggestedAnswer[]> {
        try {
            const { data, error } = await supabase
                .from('knowledge_suggestions')
                .select(`
          *,
          entry:knowledge_entries (
            id,
            question_text,
            answer_text,
            tags,
            course_code,
            view_count,
            helpful_count,
            instructor:profiles (
              full_name,
              avatar_url
            )
          )
        `)
                .match({ ticket_id: ticketId } as any)
                .order('rank_position', { ascending: true });

            if (error || !data) {
                return [];
            }

            return data.map((item: any) => ({
                id: item.entry.id,
                source: 'knowledge_base' as const,
                questionText: item.entry.question_text,
                answerText: item.entry.answer_text,
                similarityScore: item.similarity_score / 100,
                confidence: this.calculateConfidence(item.similarity_score / 100),
                metadata: {
                    instructorName: item.entry.instructor?.full_name,
                    instructorAvatar: item.entry.instructor?.avatar_url,
                    courseCode: item.entry.course_code,
                    tags: item.entry.tags || [],
                    viewCount: item.entry.view_count || 0,
                    helpfulCount: item.entry.helpful_count || 0
                }
            }));
        } catch (error) {
            console.error('Failed to get saved suggestions:', error);
            return [];
        }
    }
}
