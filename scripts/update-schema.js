#!/usr/bin/env node

/**
 * Script helper để update schema: generate migration, apply và update types
 *
 * Cách sử dụng:
 * 1. Thay đổi schema trong src/db/schema.ts
 * 2. Chạy: node scripts/update-schema.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Updating schema...\n');

try {
  // Step 1: Generate migration
  console.log('📦 Step 1: Generating migration...');
  execSync('npm run db:generate', { stdio: 'inherit' });

  // Step 2: Ask user to review (simulate with timeout)
  console.log('\n⏳ Step 2: Please review the generated migration file');
  console.log('   Then run: npm run db:push');
  console.log('   Or use Supabase CLI: supabase db push');

  console.log('\n📝 Step 3: After applying migration, update types:');
  console.log('   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types-new.ts');

  console.log('\n✅ Schema update workflow completed!');
  console.log('🔄 Next steps:');
  console.log('   1. Review migration SQL');
  console.log('   2. Apply migration to database');
  console.log('   3. Update TypeScript types');

} catch (error) {
  console.error('❌ Error updating schema:', error.message);
  process.exit(1);
}
