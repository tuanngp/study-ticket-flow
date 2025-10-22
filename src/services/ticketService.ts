import { supabase } from "@/integrations/supabase/client";

export interface TicketFormData {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'question' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  courseCode?: string;
  className?: string;
  projectGroup?: string;
}

export interface AITriageResult {
  // Raw fields from edge function (snake_case)
  suggested_priority?: 'low' | 'medium' | 'high' | 'critical';
  suggested_type?: string;
  suggested_assignee?: string;
  analysis?: string;
  // Normalized camelCase fields for UI convenience
  suggestedPriority?: 'low' | 'medium' | 'high' | 'critical';
  suggestedType?: string;
}

export interface CreatedTicket {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  creator_id: string;
  ai_suggested_priority?: string;
  created_at: string;
  updated_at: string;
}

export class TicketService {
  /**
   * Call AI triage function to get suggestions for ticket
   */
  static async getAITriageSuggestions(formData: TicketFormData): Promise<AITriageResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke("ai-triage", {
        body: {
          title: formData.title,
          description: formData.description,
          type: formData.type,
        },
      });

      if (error) {
        console.error('Error calling AI triage:', error);
        return null;
      }

      if (!data) return null;

      // Normalize edge response to camelCase while preserving originals
      const normalized: AITriageResult = {
        ...data,
        suggestedPriority: (data as any).suggested_priority,
        suggestedType: (data as any).suggested_type,
      };

      return normalized;
    } catch (error) {
      console.error('Error in getAITriageSuggestions:', error);
      return null;
    }
  }

  /**
   * Create a new ticket with AI triage suggestions
   */
  static async createTicket(
    formData: TicketFormData,
    creatorId: string
  ): Promise<CreatedTicket> {
    try {
      // Validate form data first
      const validation = this.validateTicketData(formData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Get AI triage suggestions first
      const aiSuggestions = await this.getAITriageSuggestions(formData);

      // Create the ticket
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          priority: formData.priority,
          creator_id: creatorId,
          ai_suggested_priority: aiSuggestions?.suggested_priority || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create ticket');
      }

      return data;
    } catch (error: any) {
      console.error('Error in createTicket:', error);
      throw new Error(error.message || 'Failed to create ticket');
    }
  }

  /**
   * Validate ticket form data
   */
  static validateTicketData(formData: TicketFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Title is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    // Additional validation for description length
    if (formData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!formData.type) {
      errors.push('Type is required');
    }

    if (!formData.priority) {
      errors.push('Priority is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
