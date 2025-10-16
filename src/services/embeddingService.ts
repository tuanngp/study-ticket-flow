/**
 * EmbeddingService - Generate embeddings using Google Gemini API
 * Uses text-embedding-004 model with 768 dimensions
 */

export class EmbeddingService {
  private static readonly GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  private static readonly EMBEDDING_MODEL = 'models/text-embedding-004';
  private static readonly API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

  /**
   * Generate embedding for a single text
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    if (!this.GEMINI_API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/${this.EMBEDDING_MODEL}:embedContent?key=${this.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.EMBEDDING_MODEL,
            content: { parts: [{ text }] }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  static async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Process in parallel with rate limiting
    const batchSize = 5;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchResults);

      // Small delay to avoid rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Validate embedding dimensions
   */
  static validateEmbedding(embedding: number[]): boolean {
    return Array.isArray(embedding) && embedding.length === 768;
  }
}

