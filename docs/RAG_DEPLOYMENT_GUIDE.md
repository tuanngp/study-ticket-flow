# RAG AI Assistant Deployment Guide

Complete guide to deploy the RAG-based AI Learning Assistant for EduTicket AI.

## 📋 Prerequisites

1. **Supabase Project**
   - Create a project at [supabase.com](https://supabase.com)
   - Note your project URL and keys

2. **Google Gemini API Key**
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Free tier available

3. **Node.js & npm**
   - Node.js 18+ installed
   - npm or pnpm package manager

## 🚀 Step-by-Step Deployment

### Step 1: Database Setup

Run the migration to create necessary tables and functions:

```bash
# Navigate to project root
cd study-ticket-flow

# Push database migration
npm run db:push

# Or manually apply migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/0002_rag_assistant_setup.sql
```

**Verify:**
- Tables created: `documents`, `chat_sessions`, `chat_messages`, `rate_limits`
- Function created: `match_documents()`
- Extension enabled: `vector`

### Step 2: Environment Variables

Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# Supabase (from dashboard → Project Settings → API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Gemini API (from Google AI Studio)
VITE_GEMINI_API_KEY=AIzaSy...your-gemini-key
```

**⚠️ Security Note:**
- NEVER commit `.env.local` to Git
- `.env.local` is already in `.gitignore`
- Use different keys for dev/prod

### Step 3: Deploy Edge Function

The `rag-assistant` edge function handles vector search and AI responses.

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Set secrets (required for edge function)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Deploy the function
supabase functions deploy rag-assistant
```

**Verify:**
- Go to Supabase Dashboard → Edge Functions
- You should see `rag-assistant` deployed
- Status should be "Active"

### Step 4: Ingest Initial Documents

Add knowledge base documents to the system:

```bash
# Install dependencies
npm install

# Install tsx for running TypeScript
npm install -g tsx

# Run ingestion script
tsx scripts/ingest-documents.ts docs/knowledge-base

# Or specify custom directory
tsx scripts/ingest-documents.ts /path/to/your/documents
```

**Sample output:**
```
╔═══════════════════════════════════════════════════════════╗
║         EduTicket AI - Document Ingestion Script         ║
╚═══════════════════════════════════════════════════════════╝

🚀 Starting document ingestion from: docs/knowledge-base

Found 2 document(s) to process

📄 Processing: fptu-faqs.md
   Found 8 chunks
   [1/8] Generating embedding...
   ✓ Chunk 1/8 uploaded
   ...
✅ fptu-faqs.md processed successfully!

📊 INGESTION SUMMARY
✅ Successfully processed: 2 file(s)
❌ Failed: 0 file(s)

🎉 Ingestion complete!
```

**Verify:**
```sql
-- Check in Supabase SQL Editor
SELECT 
  title, 
  COUNT(*) as chunk_count 
FROM documents 
GROUP BY title;
```

### Step 5: Test the Assistant

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Navigate to `http://localhost:5173`
   - Login to the application
   - You should see the floating chat widget (bottom-right)

3. **Test queries:**
   - Click the chat widget
   - Try: "Quy định về điểm danh là gì?"
   - Try: "Làm sao để fix lỗi NullPointerException?"
   - Verify responses use document content

### Step 6: Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your hosting (Vercel, Netlify, etc.)
# Example with Vercel:
vercel --prod
```

## 🎯 Post-Deployment Checklist

### Functional Tests
- [ ] Chat widget appears for authenticated users
- [ ] Session creation works
- [ ] Messages send and receive correctly
- [ ] Sources are cited in responses
- [ ] Rate limiting works (20 requests/hour)
- [ ] Error messages display properly

### Admin Features
- [ ] Access `/admin/documents` as instructor/admin
- [ ] Upload new document (.txt or .md)
- [ ] Document statistics display correctly
- [ ] Delete document works

### Performance Tests
- [ ] Vector search returns results < 2 seconds
- [ ] Embedding generation works
- [ ] Chat responses arrive < 5 seconds
- [ ] No memory leaks in widget

### Security Tests
- [ ] Non-authenticated users don't see widget
- [ ] Students can't access `/admin/documents`
- [ ] Rate limiting prevents abuse
- [ ] Service role key not exposed to frontend
- [ ] CORS configured correctly

## 📊 Monitoring & Maintenance

### Check System Health

```sql
-- Total documents and chunks
SELECT 
  COUNT(DISTINCT title) as documents,
  COUNT(*) as chunks,
  SUM(LENGTH(content)) as total_chars
FROM documents;

-- Chat activity (last 7 days)
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(*) as messages
FROM chat_messages
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Rate limit status
SELECT 
  user_id,
  count,
  reset_at
FROM rate_limits
WHERE reset_at > NOW()
ORDER BY count DESC;

-- Most common queries (from user messages)
SELECT 
  content,
  COUNT(*) as frequency
FROM chat_messages
WHERE role = 'user'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY content
ORDER BY frequency DESC
LIMIT 10;
```

### Update Documents

```bash
# Add new documents
tsx scripts/ingest-documents.ts docs/knowledge-base/new-docs

# Or use admin UI
# Navigate to /admin/documents
# Upload files through web interface
```

### Backup Documents

```bash
# Export documents
supabase db dump --data-only -t documents > backup-documents.sql

# Restore if needed
psql -h your-supabase-host -d postgres < backup-documents.sql
```

## 🔧 Troubleshooting

### Issue: "Documents table not found"
**Solution:**
```bash
# Rerun migration
npm run db:push
# Or manually apply: supabase/migrations/0002_rag_assistant_setup.sql
```

### Issue: "Embedding generation failed"
**Possible causes:**
1. Invalid Gemini API key
2. Rate limit exceeded (Gemini free tier: 60 requests/minute)
3. Network/proxy issues

**Solution:**
```bash
# Test API key manually
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"models/gemini-embedding-001","content":{"parts":[{"text":"test"}]}}'
```

### Issue: "Edge function returns 500 error"
**Solution:**
```bash
# Check function logs
supabase functions logs rag-assistant

# Verify secrets are set
supabase secrets list

# Redeploy
supabase functions deploy rag-assistant --no-verify-jwt
```

### Issue: "No results from vector search"
**Possible causes:**
1. No documents ingested
2. Similarity threshold too high
3. Embedding dimension mismatch

**Solution:**
```sql
-- Check documents exist
SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;

-- Test direct vector search
SELECT title, content 
FROM documents 
ORDER BY embedding <=> '[0.1,0.2,...]'::vector 
LIMIT 5;

-- Lower threshold in edge function (temporary)
-- Edit: match_threshold: 0.6 → 0.4
```

### Issue: "Chat widget not appearing"
**Solution:**
1. Check browser console for errors
2. Verify user is authenticated
3. Check `AIAssistantWidget` is imported in `App.tsx`
4. Clear browser cache

### Issue: "Rate limit too strict"
**Solution:**
Adjust in `supabase/functions/rag-assistant/index.ts`:
```typescript
p_max_requests: 20 → 50,  // Increase limit
p_window_minutes: 60 → 120  // Extend window
```

## 🎨 Customization

### Change Chat Widget Position
Edit `src/components/AIAssistantWidget.tsx`:
```typescript
// Current: bottom-right
className="fixed bottom-6 right-6 ..."

// Top-right
className="fixed top-6 right-6 ..."

// Bottom-left
className="fixed bottom-6 left-6 ..."
```

### Adjust Chunk Size
Edit `src/services/documentIngestionService.ts`:
```typescript
private static readonly CHUNK_SIZE = 1000; // → 1500
private static readonly CHUNK_OVERLAP = 200; // → 300
```

### Modify System Prompt
Edit `supabase/functions/rag-assistant/index.ts`:
```typescript
const systemPrompt = `
  [Your custom instructions here]
  Context: ${context}
`;
```

### Change AI Model
Edit `supabase/functions/rag-assistant/index.ts`:
```typescript
const GEMINI_MODEL = 'gemini-2.0-flash-exp';
// Options:
// - gemini-1.5-pro (more capable, slower)
// - gemini-1.5-flash (balanced)
// - gemini-2.0-flash-exp (experimental, fastest)
```

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

## 💡 Tips for Production

1. **Use Supabase Production Database**
   - Separate dev/staging/prod projects
   - Different API keys per environment

2. **Monitor Costs**
   - Gemini API: Free tier → 60 req/min
   - Supabase: Free tier → 500MB database
   - Vector index: Affects query performance

3. **Optimize Performance**
   - Increase IVFFlat lists for larger datasets
   - Cache frequent embeddings
   - Use CDN for frontend assets

4. **Content Moderation**
   - Review user queries periodically
   - Add profanity filters if needed
   - Implement feedback mechanism

5. **Regular Updates**
   - Refresh documents monthly
   - Update FAQs based on common questions
   - Improve prompts based on user feedback

---

**Need Help?**
- Create a ticket in EduTicket AI system
- Check project README.md
- Review error logs in Supabase dashboard

