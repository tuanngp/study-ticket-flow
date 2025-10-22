import { supabase } from "@/integrations/supabase/client";

export interface ReviewData {
  ticketId: string;
  reviewerId: string;
  overallRating: number; // 1-5 scale
  qualityRating?: number; // 1-5 scale
  completenessRating?: number; // 1-5 scale
  clarityRating?: number; // 1-5 scale
  helpfulnessRating?: number; // 1-5 scale
  feedback?: string;
  suggestions?: string;
  isAnonymous?: boolean;
  metadata?: Record<string, any>;
}

export interface ReviewResult {
  id: string;
  ticketId: string;
  reviewerId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  overallRating: number;
  qualityRating?: number;
  completenessRating?: number;
  clarityRating?: number;
  helpfulnessRating?: number;
  feedback?: string;
  suggestions?: string;
  isAnonymous: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  ticket?: {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>; // {1: count, 2: count, ...}
  criteriaAverages: Record<string, number>;
  recentReviews: ReviewResult[];
}

export class ReviewService {
  /**
   * Create an AI-generated self-review for the ticket creator
   */
  static async createAISelfReview(
    ticketId: string,
    userId: string,
    ai: {
      overall: number;
      quality?: number;
      completeness?: number;
      clarity?: number;
      helpfulness?: number;
      feedback?: string;
      suggestions?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ReviewResult> {
    // Prevent duplicates from same user on same ticket
    const existing = await this.getReviewByTicketAndReviewer(ticketId, userId);
    if (existing) {
      throw new Error('You have already reviewed this ticket');
    }

    const insert = {
      ticket_id: ticketId,
      reviewer_id: userId,
      status: 'completed',
      overall_rating: ai.overall,
      quality_rating: ai.quality ?? null,
      completeness_rating: ai.completeness ?? null,
      clarity_rating: ai.clarity ?? null,
      helpfulness_rating: ai.helpfulness ?? null,
      feedback: ai.feedback ?? null,
      suggestions: ai.suggestions ?? null,
      is_anonymous: false,
      metadata: { ...(ai.metadata || {}), ai_generated: true },
    };

    const { data, error } = await (supabase as any)
      .from('ticket_reviews')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create AI self-review');
    }

    const review = this.mapRowToReview(data);
    // Notify UI to refresh reviews in-place
    try {
      window.dispatchEvent(new CustomEvent('review:created', {
        detail: { ticketId, review }
      }));
    } catch {}
    return review;
  }
  private static mapRowToReview(row: any): ReviewResult {
    return {
      id: row.id,
      ticketId: row.ticket_id,
      reviewerId: row.reviewer_id,
      status: row.status,
      overallRating: row.overall_rating,
      qualityRating: row.quality_rating ?? undefined,
      completenessRating: row.completeness_rating ?? undefined,
      clarityRating: row.clarity_rating ?? undefined,
      helpfulnessRating: row.helpfulness_rating ?? undefined,
      feedback: row.feedback ?? undefined,
      suggestions: row.suggestions ?? undefined,
      isAnonymous: row.is_anonymous ?? false,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Optional hydration can be added later
      reviewer: undefined,
      ticket: undefined,
    };
  }

  /**
   * Create a new review for a ticket (using localStorage temporarily)
   */
  static async createReview(reviewData: ReviewData): Promise<ReviewResult> {
    try {
      // Validate review data
      const validation = this.validateReviewData(reviewData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Check if reviewer has permission to review this ticket
      await this.checkReviewPermission(reviewData.ticketId, reviewData.reviewerId);

      // Insert into Supabase
      const { data, error } = await (supabase as any)
        .from('ticket_reviews')
        .insert({
          ticket_id: reviewData.ticketId,
          reviewer_id: reviewData.reviewerId,
          status: 'completed',
          overall_rating: reviewData.overallRating,
          quality_rating: reviewData.qualityRating ?? null,
          completeness_rating: reviewData.completenessRating ?? null,
          clarity_rating: reviewData.clarityRating ?? null,
          helpfulness_rating: reviewData.helpfulnessRating ?? null,
          feedback: reviewData.feedback ?? null,
          suggestions: reviewData.suggestions ?? null,
          is_anonymous: reviewData.isAnonymous ?? false,
          metadata: reviewData.metadata ?? null,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create review');
      }

      const review = this.mapRowToReview(data);
      // Notify UI to refresh reviews in-place
      try {
        window.dispatchEvent(new CustomEvent('review:created', {
          detail: { ticketId: reviewData.ticketId, review }
        }));
      } catch {}
      return review;
    } catch (error: any) {
      console.error('Error in createReview:', error);
      throw new Error(error.message || 'Failed to create review');
    }
  }

  /**
   * Update an existing review
   */
  static async updateReview(
    reviewId: string, 
    updates: Partial<ReviewData>,
    reviewerId: string
  ): Promise<ReviewResult> {
    try {
      // Ensure ownership
      const current = await this.getReviewById(reviewId);
      if (!current) throw new Error('Review not found');
      if (current.reviewerId !== reviewerId) throw new Error('You can only update your own reviews');

      const { data, error } = await (supabase as any)
        .from('ticket_reviews')
        .update({
          overall_rating: updates.overallRating ?? current.overallRating,
          quality_rating: updates.qualityRating ?? current.qualityRating ?? null,
          completeness_rating: updates.completenessRating ?? current.completenessRating ?? null,
          clarity_rating: updates.clarityRating ?? current.clarityRating ?? null,
          helpfulness_rating: updates.helpfulnessRating ?? current.helpfulnessRating ?? null,
          feedback: updates.feedback ?? current.feedback ?? null,
          suggestions: updates.suggestions ?? current.suggestions ?? null,
          is_anonymous: updates.isAnonymous ?? current.isAnonymous,
          metadata: updates.metadata ?? current.metadata ?? null,
        })
        .eq('id', reviewId)
        .select('*')
        .single();

      if (error) throw new Error(error.message || 'Failed to update review');
      const review = this.mapRowToReview(data);
      // Notify UI to refresh reviews in-place
      try {
        window.dispatchEvent(new CustomEvent('review:updated', {
          detail: { ticketId: review.ticketId, review }
        }));
      } catch {}
      return review;
    } catch (error: any) {
      console.error('Error in updateReview:', error);
      throw new Error(error.message || 'Failed to update review');
    }
  }

  /**
   * Get review by ID
   */
  static async getReviewById(reviewId: string): Promise<ReviewResult | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('ticket_reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (error) return null;
      return data ? this.mapRowToReview(data) : null;
    } catch (error: any) {
      console.error('Error in getReviewById:', error);
      throw new Error(error.message || 'Failed to get review');
    }
  }

  /**
   * Get reviews for a specific ticket
   */
  static async getTicketReviews(ticketId: string): Promise<ReviewResult[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ticket_reviews')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      const rows = (data || []).map(this.mapRowToReview.bind(this));

      // Hydrate reviewer display info (non-anonymous only)
      const nonAnonymous = rows.filter(r => !r.isAnonymous);
      const reviewerIds = Array.from(new Set(nonAnonymous.map(r => r.reviewerId)));

      if (reviewerIds.length > 0) {
        const { data: profilesData } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', reviewerIds);

        const idToProfile: Record<string, any> = {};
        (profilesData || []).forEach((p: any) => { idToProfile[p.id] = p; });

        return rows.map(r => (
          r.isAnonymous ? r : { ...r, reviewer: idToProfile[r.reviewerId] }
        ));
      }

      return rows;
    } catch (error: any) {
      console.error('Error in getTicketReviews:', error);
      throw new Error(error.message || 'Failed to get ticket reviews');
    }
  }

  /**
   * Get reviews by a specific reviewer
   */
  static async getReviewsByReviewer(reviewerId: string): Promise<ReviewResult[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('ticket_reviews')
        .select('*')
        .eq('reviewer_id', reviewerId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(this.mapRowToReview.bind(this));
    } catch (error: any) {
      console.error('Error in getReviewsByReviewer:', error);
      throw new Error(error.message || 'Failed to get reviewer reviews');
    }
  }

  /**
   * Get review statistics for a ticket
   */
  static async getTicketReviewStats(ticketId: string): Promise<ReviewStats> {
    try {
      const reviews = await this.getTicketReviews(ticketId);
      
      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: {},
          criteriaAverages: {},
          recentReviews: []
        };
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
      const averageRating = totalRating / reviews.length;

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = reviews.filter(r => r.overallRating === i).length;
      }

      // Calculate criteria averages
      const criteriaAverages: Record<string, number> = {};
      const criteria = ['quality', 'completeness', 'clarity', 'helpfulness'];
      
      criteria.forEach(criteria => {
        const ratings = reviews
          .map(r => r[`${criteria}Rating` as keyof ReviewResult] as number)
          .filter(rating => rating !== undefined);
        
        if (ratings.length > 0) {
          criteriaAverages[criteria] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }
      });

      return {
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
        criteriaAverages,
        recentReviews: reviews.slice(0, 5) // Last 5 reviews
      };
    } catch (error: any) {
      console.error('Error in getTicketReviewStats:', error);
      throw new Error(error.message || 'Failed to get review statistics');
    }
  }

  /**
   * Check if user can review a ticket
   */
  static async canReviewTicket(ticketId: string, userId: string): Promise<boolean> {
    try {
      // Get user profile to check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!profile) return false;

      // Only instructors and admins can review tickets
      if (!['instructor', 'admin'].includes(profile.role)) {
        return false;
      }

      // Check if user has already reviewed this ticket
      const { data: existing } = await (supabase as any)
        .from('ticket_reviews')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('reviewer_id', userId)
        .maybeSingle();

      return !existing;
    } catch (error) {
      console.error('Error in canReviewTicket:', error);
      return false;
    }
  }

  /**
   * Get review by ticket and reviewer
   */
  private static async getReviewByTicketAndReviewer(
    ticketId: string, 
    reviewerId: string
  ): Promise<ReviewResult | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('ticket_reviews')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('reviewer_id', reviewerId)
        .maybeSingle();

      if (error) return null;
      return data ? this.mapRowToReview(data) : null;
    } catch (error: any) {
      console.error('Error in getReviewByTicketAndReviewer:', error);
      return null;
    }
  }

  /**
   * Check review permission
   */
  private static async checkReviewPermission(ticketId: string, reviewerId: string): Promise<void> {
    const canReview = await this.canReviewTicket(ticketId, reviewerId);
    if (!canReview) {
      throw new Error('You do not have permission to review this ticket');
    }
  }

  /**
   * Validate review data
   */
  private static validateReviewData(reviewData: ReviewData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reviewData.ticketId) {
      errors.push('Ticket ID is required');
    }

    if (!reviewData.reviewerId) {
      errors.push('Reviewer ID is required');
    }

    if (!reviewData.overallRating || reviewData.overallRating < 1 || reviewData.overallRating > 5) {
      errors.push('Overall rating must be between 1 and 5');
    }

    // Validate individual criteria ratings if provided
    const criteria = ['qualityRating', 'completenessRating', 'clarityRating', 'helpfulnessRating'];
    criteria.forEach(criteria => {
      const rating = reviewData[criteria as keyof ReviewData] as number;
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        errors.push(`${criteria} must be between 1 and 5`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get reviews from localStorage for a specific ticket
   */
  // Storage no longer used; all data is persisted in Supabase
}
