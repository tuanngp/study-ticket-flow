/**
 * DocumentIngestionService - Process and ingest documents into RAG system
 * Handles text chunking, embedding generation, and database upload
 */

import { supabase } from '@/integrations/supabase/client';
import { EmbeddingService } from './embeddingService';

export interface DocumentChunk {
  title: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
}

export interface IngestionProgress {
  current: number;
  total: number;
  fileName: string;
}

export class DocumentIngestionService {
  // Chunk size optimized for Gemini context windows
  private static readonly CHUNK_SIZE = 1000; // characters
  private static readonly CHUNK_OVERLAP = 200; // overlap for context continuity

  /**
   * Split text into overlapping chunks
   */
  static chunkText(text: string, chunkSize = this.CHUNK_SIZE): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: string[] = [];
    const cleanText = text.trim();

    for (let i = 0; i < cleanText.length; i += chunkSize - this.CHUNK_OVERLAP) {
      const chunk = cleanText.slice(i, i + chunkSize);
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  /**
   * Process a single document: chunk, embed, and upload
   */
  static async processDocument(
    content: string,
    title: string,
    metadata: Record<string, any> = {},
    onProgress?: (progress: IngestionProgress) => void
  ): Promise<number> {
    try {
      const chunks = this.chunkText(content);

      if (chunks.length === 0) {
        throw new Error('No valid chunks generated from document');
      }

      console.log(`Processing "${title}": ${chunks.length} chunks`);

      let uploadedCount = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Generate embedding
        const embedding = await EmbeddingService.generateEmbedding(chunk);

        // Upload to database
        const { error } = await supabase.from('documents').insert({
          title,
          content: chunk,
          chunk_index: i,
          embedding: `[${embedding.join(',')}]`,
          metadata: {
            ...metadata,
            total_chunks: chunks.length,
            chunk_size: chunk.length
          }
        });

        if (error) {
          console.error(`Error uploading chunk ${i + 1}:`, error);
          throw new Error(`Failed to upload chunk ${i + 1}: ${error.message}`);
        }

        uploadedCount++;

        // Report progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: chunks.length,
            fileName: title
          });
        }

        console.log(`✓ Chunk ${i + 1}/${chunks.length} embedded and uploaded`);
      }

      return uploadedCount;
    } catch (error: any) {
      console.error(`Error processing document "${title}":`, error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Process file from File object (for web upload)
   */
  static async processFile(
    file: File,
    metadata: Record<string, any> = {},
    onProgress?: (progress: IngestionProgress) => void
  ): Promise<number> {
    try {
      const content = await file.text();
      return await this.processDocument(
        content,
        file.name,
        {
          ...metadata,
          source_file: file.name,
          file_type: file.type,
          file_size: file.size
        },
        onProgress
      );
    } catch (error: any) {
      console.error(`Error processing file "${file.name}":`, error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  /**
   * Delete all documents with a specific title
   */
  static async deleteDocument(title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('title', title);

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✓ Deleted document: ${title}`);
    } catch (error: any) {
      console.error(`Error deleting document "${title}":`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get list of all documents
   */
  static async listDocuments(): Promise<Array<{
    title: string;
    chunkCount: number;
    lastUpdated: string;
    metadata: any;
  }>> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('title, metadata, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Group by title and count chunks
      const docMap = new Map<string, any>();
      
      data?.forEach(doc => {
        if (!docMap.has(doc.title)) {
          docMap.set(doc.title, {
            title: doc.title,
            chunkCount: 1,
            lastUpdated: doc.updated_at,
            metadata: doc.metadata
          });
        } else {
          const existing = docMap.get(doc.title);
          existing.chunkCount++;
        }
      });

      return Array.from(docMap.values());
    } catch (error: any) {
      console.error('Error listing documents:', error);
      throw new Error(`Failed to list documents: ${error.message}`);
    }
  }

  /**
   * Get total document count and statistics
   */
  static async getStatistics(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    totalSize: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('title, metadata');

      if (error) {
        throw new Error(error.message);
      }

      const uniqueTitles = new Set(data?.map(d => d.title) || []);
      const totalSize = data?.reduce((sum, doc) => {
        return sum + (doc.metadata?.chunk_size || 0);
      }, 0) || 0;

      return {
        totalDocuments: uniqueTitles.size,
        totalChunks: data?.length || 0,
        totalSize
      };
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      return {
        totalDocuments: 0,
        totalChunks: 0,
        totalSize: 0
      };
    }
  }
}

