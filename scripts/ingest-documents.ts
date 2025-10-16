/**
 * Document Ingestion Script
 * 
 * Usage:
 *   tsx scripts/ingest-documents.ts <directory-path>
 *   tsx scripts/ingest-documents.ts docs/knowledge-base
 * 
 * This script processes all .txt and .md files in the specified directory,
 * chunks them, generates embeddings using Gemini API, and uploads to Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - VITE_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  if (!GEMINI_API_KEY) console.error('  - VITE_GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const EMBEDDING_MODEL = 'models/gemini-embedding-001';
const CHUNK_SIZE = 2048;
const CHUNK_OVERLAP = 200;

/**
 * Generate embedding using Gemini API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          content: { parts: [{ text }] },
          output_dimensionality: 768
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
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Chunk text into overlapping segments
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const cleanText = text.trim();

  for (let i = 0; i < cleanText.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = cleanText.slice(i, i + CHUNK_SIZE);
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}

/**
 * Process a single document file
 */
async function processDocument(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);

  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content || content.trim().length === 0) {
      console.warn(`⚠️  Skipping empty file: ${fileName}`);
      return;
    }

    // Chunk the content
    const chunks = chunkText(content);
    console.log(`   Found ${chunks.length} chunks`);

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      console.log(`   [${i + 1}/${chunks.length}] Generating embedding...`);
      const embedding = await generateEmbedding(chunk);

      // Upload to Supabase
      const { error } = await supabase.from('documents').insert({
        title: fileName,
        content: chunk,
        chunk_index: i,
        embedding: `[${embedding.join(',')}]`,
        metadata: {
          source_file: fileName,
          total_chunks: chunks.length,
          chunk_size: chunk.length,
          ingested_at: new Date().toISOString(),
          category: 'faq',
          language: 'vi'
        }
      });

      if (error) {
        console.error(`   ❌ Failed to upload chunk ${i + 1}:`, error.message);
        throw error;
      }

      console.log(`   ✓ Chunk ${i + 1}/${chunks.length} uploaded`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ ${fileName} processed successfully!`);
  } catch (error: any) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Process all documents in a directory
 */
async function processDirectory(dirPath: string): Promise<void> {
  console.log(`\n🚀 Starting document ingestion from: ${dirPath}\n`);

  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    // Get all files
    const files = fs.readdirSync(dirPath);
    const supportedFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.txt', '.md'].includes(ext);
    });

    if (supportedFiles.length === 0) {
      console.warn('⚠️  No .txt or .md files found in directory');
      return;
    }

    console.log(`Found ${supportedFiles.length} document(s) to process`);

    // Process each file
    let successCount = 0;
    let failCount = 0;

    for (const file of supportedFiles) {
      const filePath = path.join(dirPath, file);
      
      try {
        await processDocument(filePath);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to process ${file}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount} file(s)`);
    console.log(`❌ Failed: ${failCount} file(s)`);
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dirPath = args[0] || './docs/knowledge-base';

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         EduTicket AI - Document Ingestion Script         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  await processDirectory(dirPath);

  console.log('🎉 Ingestion complete!\n');
}

// Run script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

