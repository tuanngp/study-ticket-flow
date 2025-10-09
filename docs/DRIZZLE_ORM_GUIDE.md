# 🚀 Hướng dẫn sử dụng Drizzle ORM với Supabase

> **Drizzle ORM** là giải pháp thay thế cho việc viết SQL migration thủ công, mang lại type safety và developer experience tốt hơn.

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Cấu trúc Schema](#-cấu-trúc-schema)
- [Migration Workflow](#-migration-workflow)
- [Query Patterns](#-query-patterns)
- [Advanced Usage](#-advanced-usage)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)

## 🎯 Giới thiệu

### Tại sao dùng Drizzle ORM?

**Trước khi có Drizzle:**
- ❌ Viết SQL migration thủ công → Dễ lỗi syntax
- ❌ Types và schema không đồng bộ → Runtime errors
- ❌ Không có type safety khi query → Hard to debug
- ❌ Khó maintain khi schema thay đổi

**Sau khi có Drizzle:**
- ✅ Define schema bằng TypeScript → Type-safe từ đầu
- ✅ Auto-generate SQL migration → Không cần viết SQL
- ✅ Schema và types luôn đồng bộ
- ✅ IntelliSense và autocomplete khi query
- ✅ Validation schema tại compile time

### Workflow hoàn chỉnh

```
Schema (TypeScript) → Generate Migration → Apply to DB → Update Types
     ↓                        ↓                    ↓            ↓
src/db/schema.ts → supabase/migrations/ → Database → types.ts
```

## 📦 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install drizzle-orm drizzle-kit postgres
```

### 2. Cấu hình Drizzle Kit

File `drizzle.config.ts` đã được tạo:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 3. Setup environment variables

Tạo file `.env` với DATABASE_URL:

```bash
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

## ⚙️ Cấu hình

### Drizzle Client

File `src/db/client.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
const postgres = require('postgres');
import * as schema from './schema';

// Tạo connection
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

// Tạo Drizzle instance
export const db = drizzle(client, { schema });

// Export schema để sử dụng ở nơi khác
export * from './schema';
```

### Schema Structure

File `src/db/schema.ts`:

```typescript
import { pgTable, text, uuid, timestamp, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Định nghĩa Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'lead', 'instructor']);

// 2. Định nghĩa Tables
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: userRoleEnum('role').notNull().default('student'),
  // ... other columns
});

// 3. Định nghĩa Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  createdTickets: many(tickets, { relationName: 'creator' }),
  assignedTickets: many(tickets, { relationName: 'assignee' }),
  comments: many(ticketComments),
}));
```

## 🏗️ Cấu trúc Schema

### Enums

```typescript
export const ticketStatusEnum = pgEnum('ticket_status', [
  'open', 'in_progress', 'resolved', 'closed'
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low', 'medium', 'high', 'critical'
]);
```

### Tables với Foreign Keys

```typescript
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  creatorId: uuid('creator_id').notNull().references(() => profiles.id, {
    onDelete: 'cascade'
  }),
  assigneeId: uuid('assignee_id').references(() => profiles.id, {
    onDelete: 'set null'
  }),
  // ... other fields
});
```

### Many-to-Many Relationships

```typescript
export const ticketTags = pgTable('ticket_tags', {
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, {
    onDelete: 'cascade'
  }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, {
    onDelete: 'cascade'
  }),
}, (table) => ({
  pk: primaryKey({ columns: [table.ticketId, table.tagId] }),
}));
```

### Relations Definition

```typescript
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [tickets.creatorId],
    references: [profiles.id],
    relationName: 'creator',
  }),
  comments: many(ticketComments),
  ticketTags: many(ticketTags),
}));
```

## 🔄 Migration Workflow

### Workflow tiêu chuẩn

```bash
# 1. Thay đổi schema trong src/db/schema.ts
#    - Thêm/sửa/xóa tables, columns, relations

# 2. Generate migration
npm run db:generate

# 3. Review migration file trong supabase/migrations/
#    - Kiểm tra SQL statements có đúng không

# 4. Apply migration lên database
npm run db:push

# 5. Update types (optional, nếu cần)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types-new.ts
```

### Scripts Helper

```bash
# Generate migration nhanh
npm run db:generate

# Push migration lên DB
npm run db:push

# Studio (GUI để view schema)
npm run db:studio
```

### Migration Files

Migration được tạo trong `supabase/migrations/`:

```
0000_initial_schema.sql
0001_add_tags_table.sql
0002_add_user_preferences.sql
```

## 🔍 Query Patterns

### Import Drizzle Client

```typescript
import { db } from '@/db/client';
import { tickets, profiles, eq, and, or } from '@/db/schema';
```

### Basic Queries

```typescript
// SELECT all tickets
const allTickets = await db.select().from(tickets);

// SELECT with WHERE
const openTickets = await db.select()
  .from(tickets)
  .where(eq(tickets.status, 'open'));

// SELECT specific columns
const ticketTitles = await db.select({
  id: tickets.id,
  title: tickets.title,
  status: tickets.status
}).from(tickets);
```

### Relations Queries

```typescript
// Single relation
const ticketWithCreator = await db.query.tickets.findFirst({
  where: eq(tickets.id, ticketId),
  with: {
    creator: true, // Load creator profile
  }
});

// Multiple relations
const ticketWithAll = await db.query.tickets.findFirst({
  with: {
    creator: true,
    assignee: true,
    comments: {
      with: {
        user: true, // Nested relation
      }
    },
    ticketTags: {
      with: {
        tag: true,
      }
    }
  }
});
```

### Insert Data

```typescript
// Insert single record
const newTicket = await db.insert(tickets).values({
  title: 'New Feature Request',
  description: 'Please add dark mode',
  creatorId: userId,
  type: 'feature',
  priority: 'medium',
}).returning();

// Insert multiple records
const newTags = await db.insert(tags).values([
  { name: 'frontend', color: '#3b82f6' },
  { name: 'backend', color: '#ef4444' },
  { name: 'urgent', color: '#f59e0b' },
]).returning();
```

### Update Data

```typescript
// Update single record
await db.update(tickets)
  .set({
    status: 'in_progress',
    assigneeId: userId,
    updatedAt: new Date(),
  })
  .where(eq(tickets.id, ticketId));

// Update with conditions
await db.update(tickets)
  .set({ status: 'resolved' })
  .where(and(
    eq(tickets.status, 'in_progress'),
    eq(tickets.assigneeId, userId)
  ));
```

### Delete Data

```typescript
// Delete single record
await db.delete(tickets).where(eq(tickets.id, ticketId));

// Delete with relations (cascade)
await db.delete(profiles).where(eq(profiles.id, userId));
```

### Advanced Queries

```typescript
// Complex WHERE with OR/AND
const filteredTickets = await db.select()
  .from(tickets)
  .where(and(
    or(
      eq(tickets.priority, 'high'),
      eq(tickets.priority, 'critical')
    ),
    eq(tickets.status, 'open')
  ));

// JOIN with manual approach
const ticketsWithCreators = await db.select({
  ticket: tickets,
  creator: profiles,
}).from(tickets)
  .innerJoin(profiles, eq(tickets.creatorId, profiles.id));

// Aggregation
const stats = await db.select({
  totalTickets: count(tickets.id),
  openTickets: count(sql`CASE WHEN ${tickets.status} = 'open' THEN 1 END`),
  highPriority: count(sql`CASE WHEN ${tickets.priority} = 'high' THEN 1 END`),
}).from(tickets);
```

## 🚀 Advanced Usage

### Custom Types

```typescript
// Custom insert type
type CreateTicketInput = typeof tickets.$inferInsert;

// Custom select type
type TicketWithRelations = typeof tickets.$inferSelect & {
  creator: typeof profiles.$inferSelect;
  comments: (typeof ticketComments.$inferSelect & {
    user: typeof profiles.$inferSelect;
  })[];
};
```

### Transactions

```typescript
await db.transaction(async (tx) => {
  // Create ticket
  const [ticket] = await tx.insert(tickets).values({
    title: 'New Project',
    description: 'Project setup',
    creatorId: userId,
  }).returning();

  // Create initial comment
  await tx.insert(ticketComments).values({
    ticketId: ticket.id,
    userId: userId,
    content: 'Project created successfully',
  });

  // Add tags
  await tx.insert(ticketTags).values([
    { ticketId: ticket.id, tagId: frontendTagId },
    { ticketId: ticket.id, tagId: backendTagId },
  ]);
});
```

### Prepared Statements

```typescript
// For frequently used queries
const getTicketsByStatus = db.select()
  .from(tickets)
  .where(eq(tickets.status, placeholder('status')))
  .prepare();

const openTickets = await getTicketsByStatus.execute({ status: 'open' });
```

### Pagination

```typescript
const getTicketsPage = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;

  const tickets = await db.select()
    .from(tickets)
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset);

  return tickets;
};
```

## 📋 Best Practices

### 1. Schema Design

```typescript
// ✅ Tốt: Consistent naming
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
});

// ❌ Xấu: Inconsistent naming
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  firstname: text('firstname'), // camelCase in DB
  lastname: text('lastname'),
  email: text('email'),
});
```

### 2. Relations

```typescript
// ✅ Tốt: Explicit relation names
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
    relationName: 'post_author', // Explicit name
  }),
  comments: many(comments, {
    relationName: 'post_comments', // Explicit name
  }),
}));
```

### 3. Query Optimization

```typescript
// ✅ Tốt: Select only needed columns
const userNames = await db.select({
  id: users.id,
  name: sql`${users.firstName} || ' ' || ${users.lastName}`,
}).from(users);

// ❌ Xấu: Select all columns
const allUsers = await db.select().from(users);
```

### 4. Error Handling

```typescript
try {
  const result = await db.insert(users).values(userData);
  return result;
} catch (error) {
  if (error.code === '23505') { // Unique constraint violation
    throw new Error('Email already exists');
  }
  throw error;
}
```

### 5. Type Safety

```typescript
// ✅ Tốt: Use inferred types
type User = typeof users.$inferSelect;
type CreateUser = typeof users.$inferInsert;

function createUser(data: CreateUser): Promise<User[]> {
  return db.insert(users).values(data).returning();
}

// ❌ Xấu: Manual types
interface User {
  id: string;
  name: string;
  email: string;
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot find module 'drizzle-orm'"

```bash
# Solution: Install dependencies
npm install drizzle-orm drizzle-kit postgres
```

#### 2. "Migration failed: relation already exists"

```bash
# Solution: Reset database hoặc adjust migration
npm run db:push -- --reset
```

#### 3. "Type error: Property 'X' does not exist"

```typescript
// Solution: Check schema definition
// Ensure column is defined in table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(), // ✅ This exists
  // age: integer('age'), // ❌ Missing this
});
```

#### 4. "Foreign key constraint failed"

```typescript
// Solution: Ensure referenced record exists
// Insert parent first, then child
await db.insert(profiles).values(profileData);
await db.insert(tickets).values({
  ...ticketData,
  creatorId: profileData.id, // Must exist
});
```

#### 5. "Column 'X' of relation 'Y' does not exist"

```bash
# Solution: Sync schema with database
npm run db:push

# Or reset and reapply all migrations
npm run db:push -- --reset
```

### Environment Variables

```bash
# .env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
SUPABASE_PROJECT_ID="your-project-id"
```

### Useful Commands

```bash
# Generate migration
npm run db:generate

# Apply migrations
npm run db:push

# Reset database (⚠️  Xóa toàn bộ data)
npm run db:push -- --reset

# View schema in browser
npm run db:studio

# Validate schema
npx tsx scripts/test-schema.ts
```

---

## 🎯 Kết luận

Drizzle ORM giúp bạn:

- ✅ **Type-safe database operations**
- ✅ **Auto-generated migrations**
- ✅ **Better developer experience**
- ✅ **Consistent schema management**
- ✅ **Easier testing và maintenance**

**Workflow khuyến nghị:**
1. Thay đổi `src/db/schema.ts`
2. Chạy `npm run db:generate`
3. Review migration file
4. Chạy `npm run db:push`
5. Test queries trong code

Happy coding! 🚀
