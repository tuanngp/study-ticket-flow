#!/usr/bin/env node

/**
 * Script helper để generate migration từ Drizzle schema
 *
 * Cách sử dụng:
 * 1. Đảm bảo đã cài đặt drizzle-kit
 * 2. Đảm bảo có file .env với DATABASE_URL
 * 3. Chạy: node scripts/generate-migration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Generating migration from Drizzle schema...\n');

// Kiểm tra xem có file .env không
if (!fs.existsSync('.env')) {
  console.error('❌ File .env không tồn tại!');
  console.log('📝 Tạo file .env với DATABASE_URL từ Supabase Dashboard');
  console.log('🔗 Settings > Database > Connection string\n');
  process.exit(1);
}

// Kiểm tra DATABASE_URL
require('dotenv').config();
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL không được tìm thấy trong file .env!');
  console.log('📝 Thêm DATABASE_URL vào file .env\n');
  process.exit(1);
}

try {
  // Generate migration
  console.log('📦 Generating SQL migration...');
  execSync('npm run db:generate', { stdio: 'inherit' });

  // List migration files
  const migrationsDir = './supabase/migrations';
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .reverse(); // Mới nhất trước

    if (files.length > 0) {
      console.log('\n✅ Migration generated successfully!');
      console.log('📁 Latest migration file:', files[0]);
      console.log('\n🔍 Review the migration file before applying:');
      console.log(`📖 cat ${path.join(migrationsDir, files[0])}`);
      console.log('\n🚀 To apply migration:');
      console.log('npm run db:push');
      console.log('# hoặc dùng Supabase CLI:');
      console.log('supabase db push');
    }
  }

} catch (error) {
  console.error('❌ Error generating migration:', error.message);
  process.exit(1);
}
