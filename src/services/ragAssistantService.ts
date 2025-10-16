/**
 * RAGAssistantService - Manage chat sessions and interact with RAG edge function
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface RAGResponse {
  response: string;
  sources: Array<{ title: string; similarity: number }>;
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export class RAGAssistantService {
  /**
   * Create a new chat session for a user
   */
  static async createSession(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data.id;
    } catch (error: any) {
      console.error('Error creating chat session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Get user's recent chat sessions
   */
  static async getUserSessions(userId: string, limit = 10): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data.map(session => ({
        id: session.id,
        userId: session.user_id,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      }));
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }
  }

  /**
   * Send a message and get AI response
   */
  static async sendMessage(
    query: string,
    sessionId: string,
    userId: string
  ): Promise<RAGResponse> {
    try {
      // Sanitize input
      const sanitizedQuery = this.sanitizeInput(query);

      if (!sanitizedQuery) {
        throw new Error('Query cannot be empty');
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('rag-assistant', {
        body: { 
          query: sanitizedQuery, 
          sessionId, 
          userId 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.response) {
        throw new Error('Invalid response from AI assistant');
      }

      return {
        response: data.response,
        sources: data.sources || []
      };
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Get chat history for a session
   */
  static async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.created_at
      }));
    } catch (error: any) {
      console.error('Error fetching history:', error);
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
  }

  /**
   * Delete a chat session and all its messages
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  /**
   * Sanitize user input
   */
  private static sanitizeInput(text: string): string {
    return text.trim().slice(0, 1000); // Max 1000 characters
  }

  /**
   * Check if user has exceeded rate limit
   */
  static async checkRateLimit(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_max_requests: 20,
        p_window_minutes: 60
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return true; // Allow on error to not block users
      }

      return data === true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow on error
    }
  }
}

