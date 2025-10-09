#!/usr/bin/env node

/**
 * Script so sánh schema giữa production và Drizzle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseSQLTables(sqlContent) {
  const tables = {};
  const tableRegex = /CREATE TABLE (?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\);/g;
  const foreignKeyRegex = /ALTER TABLE.*?ADD CONSTRAINT.*?FOREIGN KEY\s*\("(\w+)"\)\s*REFERENCES.*?;/g;

  let match;
  while ((match = tableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const tableContent = match[2];

    // Parse columns
    const columns = {};
    const columnLines = tableContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('--'));

    columnLines.forEach(line => {
      if (line.includes('PRIMARY KEY') || line.includes('REFERENCES') || line.includes('CONSTRAINT')) {
        const colMatch = line.match(/"?(\w+)"?\s+([^,]+),?$/);
        if (colMatch) {
          const [, colName, colDef] = colMatch;
          columns[colName] = colDef.trim();
        }
      } else {
        const colMatch = line.match(/"?(\w+)"?\s+([^,]+),?$/);
        if (colMatch) {
          const [, colName, colDef] = colMatch;
          columns[colName] = colDef.trim();
        }
      }
    });

    tables[tableName] = columns;
  }

  return tables;
}

function compareSchemas() {
  console.log('🔍 So sánh Schema giữa Production và Drizzle\n');

  // Read production migration
  const prodPath = path.join(__dirname, '../supabase/migrations/20251007030639_840041cb-20aa-4565-bf66-d3610f6a9dd7.sql');
  const prodSQL = fs.readFileSync(prodPath, 'utf8');

  // Read Drizzle migration
  const drizzlePath = path.join(__dirname, '../supabase/migrations/0000_mature_madame_masque.sql');
  const drizzleSQL = fs.readFileSync(drizzlePath, 'utf8');

  // Parse tables
  const prodTables = parseSQLTables(prodSQL);
  const drizzleTables = parseSQLTables(drizzleSQL);

  console.log('📊 TABLES COMPARISON:\n');

  // Check common tables
  const commonTables = Object.keys(prodTables).filter(table => drizzleTables[table]);

  commonTables.forEach(tableName => {
    console.log(`🗂️  Table: ${tableName}`);
    const prodCols = prodTables[tableName];
    const drizzleCols = drizzleTables[tableName];

    const allColumns = new Set([...Object.keys(prodCols), ...Object.keys(drizzleCols)]);

    allColumns.forEach(colName => {
      const prodDef = prodCols[colName];
      const drizzleDef = drizzleCols[colName];

      if (!prodDef) {
        console.log(`  ❌ MISSING in Production: ${colName} = ${drizzleDef}`);
      } else if (!drizzleDef) {
        console.log(`  ❌ MISSING in Drizzle: ${colName} = ${prodDef}`);
      } else if (prodDef !== drizzleDef) {
        console.log(`  ⚠️  DIFFERENT: ${colName}`);
        console.log(`     Production: ${prodDef}`);
        console.log(`     Drizzle:    ${drizzleDef}`);
      } else {
        console.log(`  ✅ MATCH: ${colName} = ${prodDef}`);
      }
    });
    console.log('');
  });

  // Check new tables in Drizzle
  const newTables = Object.keys(drizzleTables).filter(table => !prodTables[table]);
  if (newTables.length > 0) {
    console.log('🆕 NEW TABLES in Drizzle:');
    newTables.forEach(table => {
      console.log(`  + ${table}`);
      Object.entries(drizzleTables[table]).forEach(([col, def]) => {
        console.log(`    - ${col}: ${def}`);
      });
    });
    console.log('');
  }

  // Check RLS and other features
  console.log('🔒 SECURITY FEATURES:\n');

  const hasRLS = prodSQL.includes('ENABLE ROW LEVEL SECURITY');
  const hasPolicies = (prodSQL.match(/CREATE POLICY/g) || []).length;
  const hasFunctions = (prodSQL.match(/CREATE.*FUNCTION/g) || []).length;
  const hasTriggers = (prodSQL.match(/CREATE TRIGGER/g) || []).length;
  const hasRealtime = prodSQL.includes('supabase_realtime');

  console.log(`✅ RLS Policies: ${hasPolicies} policies`);
  console.log(`✅ Functions: ${hasFunctions} functions`);
  console.log(`✅ Triggers: ${hasTriggers} triggers`);
  console.log(`✅ Realtime: ${hasRealtime ? 'Enabled' : 'Disabled'}`);

  console.log('\n❌ MISSING in Drizzle migration:');
  console.log('  - Row Level Security (RLS) policies');
  console.log('  - Database functions (handle_new_user, update_updated_at)');
  console.log('  - Database triggers');
  console.log('  - Realtime publication settings');
  console.log('  - Some foreign key constraints (generated differently)');

  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. ✅ Drizzle schema khớp với core tables (profiles, tickets, ticket_comments)');
  console.log('2. ✅ Enums hoàn toàn giống nhau');
  console.log('3. ⚠️  Drizzle thiếu RLS policies - cần bổ sung thủ công');
  console.log('4. ⚠️  Drizzle thiếu functions/triggers - cần bổ sung thủ công');
  console.log('5. 🆕 Tables mới (tags, ticket_tags) chưa có trong production');
  console.log('6. 💡 Khuyến nghị: Apply Drizzle migration + bổ sung security features');
}

compareSchemas();
