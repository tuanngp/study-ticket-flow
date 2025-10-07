import { supabase } from "@/integrations/supabase/client";

export interface TicketFormData {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'question' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AITriageResult {
  suggested_priority?: 'low' | 'medium' | 'high' | 'critical';
  suggested_assignee?: string;
  analysis?: string;
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

      return data;
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
      // Get AI triage suggestions first
      const aiSuggestions = await this.getAITriageSuggestions(formData);

      // Create the ticket
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          title: formData.title,
          description: formData.description,
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
