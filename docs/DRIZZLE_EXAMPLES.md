# 💡 Examples thực tế với Drizzle ORM

> Các ví dụ cụ thể từ dự án Study Ticket Flow

## 📝 Import patterns

```typescript
// src/services/ticketService.ts
import { db } from '@/db/client';
import { tickets, profiles, ticketComments, eq, and, desc } from '@/db/schema';
import type { TicketWithRelations } from '@/types/ticket';

// src/hooks/useTickets.ts
import { useQuery } from '@tanstack/react-query';
import { db } from '@/db/client';
import { tickets, profiles } from '@/db/schema';
```

## 🎫 Ticket Management Examples

### Tạo ticket mới với validation

```typescript
// src/services/ticketService.ts
export const createTicket = async (data: {
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'question' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  creatorId: string;
  tags?: string[];
}) => {
  return await db.transaction(async (tx) => {
    // 1. Insert ticket
    const [ticket] = await tx.insert(tickets).values({
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      creatorId: data.creatorId,
    }).returning();

    // 2. Add tags if provided
    if (data.tags?.length) {
      const tagRecords = data.tags.map(tagId => ({
        ticketId: ticket.id,
        tagId,
      }));
      await tx.insert(ticketTags).values(tagRecords);
    }

    return ticket;
  });
};
```

### Lấy ticket với đầy đủ relations

```typescript
// src/services/ticketService.ts
export const getTicketWithRelations = async (ticketId: string) => {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    with: {
      creator: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
          role: true,
        },
      },
      assignee: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
          role: true,
        },
      },
      comments: {
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: desc(ticketComments.createdAt),
      },
      ticketTags: {
        with: {
          tag: {
            columns: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  return ticket;
};
```

### Update ticket status với business logic

```typescript
// src/services/ticketService.ts
export const updateTicketStatus = async (
  ticketId: string,
  newStatus: 'open' | 'in_progress' | 'resolved' | 'closed',
  userId: string
) => {
  // Validate transition
  const validTransitions = {
    open: ['in_progress'],
    in_progress: ['resolved', 'closed'],
    resolved: ['closed'],
    closed: [], // Final state
  };

  const currentTicket = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    columns: { status: true, assigneeId: true },
  });

  if (!currentTicket) {
    throw new Error('Ticket not found');
  }

  // Business rules
  if (currentTicket.status === 'closed') {
    throw new Error('Cannot update closed ticket');
  }

  if (!validTransitions[currentTicket.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentTicket.status} to ${newStatus}`);
  }

  // Update ticket
  const [updatedTicket] = await db.update(tickets)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  return updatedTicket;
};
```

## 👥 Profile Management Examples

### Lấy profile với stats

```typescript
// src/services/profileService.ts
export const getProfileWithStats = async (userId: string) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (!profile) return null;

  // Get stats in parallel
  const [createdCount, assignedCount, commentCount] = await Promise.all([
    db.$count(tickets, eq(tickets.creatorId, userId)),
    db.$count(tickets, eq(tickets.assigneeId, userId)),
    db.$count(ticketComments, eq(ticketComments.userId, userId)),
  ]);

  return {
    ...profile,
    stats: {
      ticketsCreated: createdCount,
      ticketsAssigned: assignedCount,
      commentsMade: commentCount,
    },
  };
};
```

### Search users với filters

```typescript
// src/services/profileService.ts
export const searchUsers = async (query: {
  search?: string;
  role?: 'student' | 'lead' | 'instructor';
  limit?: number;
  offset?: number;
}) => {
  const conditions = [];

  if (query.search) {
    conditions.push(
      or(
        ilike(profiles.email, `%${query.search}%`),
        ilike(profiles.fullName, `%${query.search}%`)
      )
    );
  }

  if (query.role) {
    conditions.push(eq(profiles.role, query.role));
  }

  const users = await db.select({
    id: profiles.id,
    email: profiles.email,
    fullName: profiles.fullName,
    role: profiles.role,
    avatarUrl: profiles.avatarUrl,
  })
  .from(profiles)
  .where(conditions.length ? and(...conditions) : undefined)
  .limit(query.limit || 20)
  .offset(query.offset || 0)
  .orderBy(profiles.fullName);

  return users;
};
```

## 💬 Comment Management Examples

### Thêm comment với mentions

```typescript
// src/services/commentService.ts
export const createComment = async (data: {
  ticketId: string;
  userId: string;
  content: string;
}) => {
  // Validate ticket exists and user can comment
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.id, data.ticketId),
    columns: { id: true },
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Create comment
  const [comment] = await db.insert(ticketComments).values({
    ticketId: data.ticketId,
    userId: data.userId,
    content: data.content,
  }).returning();

  // Process mentions (@username)
  const mentionRegex = /@(\w+)/g;
  const mentions = [...data.content.matchAll(mentionRegex)].map(match => match[1]);

  // TODO: Handle mentions - send notifications

  return comment;
};
```

### Lấy comments với pagination

```typescript
// src/services/commentService.ts
export const getTicketComments = async (
  ticketId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  const comments = await db.query.ticketComments.findMany({
    where: eq(ticketComments.ticketId, ticketId),
    with: {
      user: {
        columns: {
          id: true,
          fullName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
    orderBy: desc(ticketComments.createdAt),
    limit,
    offset,
  });

  // Get total count for pagination
  const totalCount = await db.$count(
    ticketComments,
    eq(ticketComments.ticketId, ticketId)
  );

  return {
    comments,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
  };
};
```

## 🏷️ Tag Management Examples

### Lấy tags phổ biến

```typescript
// src/services/tagService.ts
export const getPopularTags = async (limit: number = 10) => {
  const tagsWithCount = await db.select({
    id: tags.id,
    name: tags.name,
    color: tags.color,
    usageCount: count(ticketTags.tagId),
  })
  .from(tags)
  .leftJoin(ticketTags, eq(tags.id, ticketTags.tagId))
  .groupBy(tags.id, tags.name, tags.color)
  .orderBy(desc(count(ticketTags.tagId)))
  .limit(limit);

  return tagsWithCount;
};
```

### Bulk assign tags

```typescript
// src/services/tagService.ts
export const assignTagsToTicket = async (
  ticketId: string,
  tagIds: string[]
) => {
  return await db.transaction(async (tx) => {
    // Remove existing tags
    await tx.delete(ticketTags).where(eq(ticketTags.ticketId, ticketId));

    // Add new tags
    if (tagIds.length > 0) {
      const tagRecords = tagIds.map(tagId => ({
        ticketId,
        tagId,
      }));
      await tx.insert(ticketTags).values(tagRecords);
    }

    return { success: true };
  });
};
```

## 📊 Statistics Examples

### Dashboard stats

```typescript
// src/services/statisticsService.ts
export const getDashboardStats = async () => {
  const [ticketStats, userStats] = await Promise.all([
    // Ticket statistics
    db.select({
      total: count(tickets.id),
      open: count(sql`CASE WHEN ${tickets.status} = 'open' THEN 1 END`),
      inProgress: count(sql`CASE WHEN ${tickets.status} = 'in_progress' THEN 1 END`),
      resolved: count(sql`CASE WHEN ${tickets.status} = 'resolved' THEN 1 END`),
      closed: count(sql`CASE WHEN ${tickets.status} = 'closed' THEN 1 END`),
    }).from(tickets),

    // User statistics
    db.select({
      totalUsers: count(profiles.id),
      students: count(sql`CASE WHEN ${profiles.role} = 'student' THEN 1 END`),
      leads: count(sql`CASE WHEN ${profiles.role} = 'lead' THEN 1 END`),
      instructors: count(sql`CASE WHEN ${profiles.role} = 'instructor' THEN 1 END`),
    }).from(profiles),
  ]);

  return {
    tickets: ticketStats[0],
    users: userStats[0],
  };
};
```

### Monthly ticket trends

```typescript
// src/services/statisticsService.ts
export const getMonthlyTicketTrends = async (months: number = 6) => {
  const trends = await db.select({
    month: sql<string>`TO_CHAR(${tickets.createdAt}, 'YYYY-MM')`,
    count: count(tickets.id),
  })
  .from(tickets)
  .where(sql`${tickets.createdAt} >= NOW() - INTERVAL '${months} months'`)
  .groupBy(sql`TO_CHAR(${tickets.createdAt}, 'YYYY-MM')`)
  .orderBy(sql`TO_CHAR(${tickets.createdAt}, 'YYYY-MM')`);

  return trends;
};
```

## 🎣 React Hooks Examples

### useTickets hook

```typescript
// src/hooks/useTickets.ts
export const useTickets = (filters?: TicketFilters) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      let query = db.select().from(tickets);

      if (filters?.status) {
        query = query.where(eq(tickets.status, filters.status));
      }

      if (filters?.priority) {
        query = query.where(eq(tickets.priority, filters.priority));
      }

      if (filters?.assigneeId) {
        query = query.where(eq(tickets.assigneeId, filters.assigneeId));
      }

      return await query.orderBy(desc(tickets.createdAt));
    },
  });
};
```

### useTicketDetails hook

```typescript
// src/hooks/useTicketDetails.ts
export const useTicketDetails = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketWithRelations(ticketId),
    enabled: !!ticketId,
  });
};
```

### useCreateTicket hook

```typescript
// src/hooks/useCreateTicket.ts
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
```

## 🔧 Utility Functions

### Type helpers

```typescript
// src/types/database.ts
export type Ticket = typeof tickets.$inferSelect;
export type CreateTicket = typeof tickets.$inferInsert;
export type UpdateTicket = typeof tickets.$inferUpdate;

export type Profile = typeof profiles.$inferSelect;
export type Comment = typeof ticketComments.$inferSelect;
export type Tag = typeof tags.$inferSelect;

// Relations
export type TicketWithCreator = Ticket & {
  creator: Profile;
};

export type TicketWithRelations = Ticket & {
  creator: Profile;
  assignee?: Profile;
  comments: (Comment & { user: Profile })[];
  ticketTags: { tag: Tag }[];
};
```

### Database helpers

```typescript
// src/lib/database.ts
export const dbHelpers = {
  // Soft delete pattern
  softDelete: (table: any, id: string) => {
    return db.update(table)
      .set({ deletedAt: new Date() })
      .where(eq(table.id, id));
  },

  // Bulk operations
  bulkInsert: async (table: any, records: any[]) => {
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await db.insert(table).values(batch).returning();
      results.push(...result);
    }

    return results;
  },

  // Pagination helper
  paginate: <T>(
    query: any,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: T[]; total: number }> => {
    const offset = (page - 1) * limit;

    return Promise.all([
      query.limit(limit).offset(offset),
      query.$count ? query.$count() : 0,
    ]).then(([data, total]) => ({ data, total }));
  },
};
```

---

## 🎯 Best Practices Summary

### 1. **Type Safety**
```typescript
// ✅ Use inferred types
type CreateTicketInput = typeof tickets.$inferInsert;

// ❌ Don't use manual types
interface CreateTicketInput {
  title: string;
  description: string;
  // ... might get out of sync
}
```

### 2. **Error Handling**
```typescript
try {
  const result = await db.insert(tickets).values(data);
  return result[0];
} catch (error) {
  if (error.code === '23505') {
    throw new AppError('DUPLICATE_ENTRY', 'Ticket already exists');
  }
  throw error;
}
```

### 3. **Transactions**
```typescript
// ✅ Use transactions for related operations
await db.transaction(async (tx) => {
  const ticket = await tx.insert(tickets).values(ticketData);
  await tx.insert(ticketTags).values(tagData);
});
```

### 4. **Query Optimization**
```typescript
// ✅ Select only needed columns
const users = await db.select({
  id: profiles.id,
  name: profiles.fullName,
}).from(profiles);

// ❌ Don't select everything
const users = await db.select().from(profiles);
```

### 5. **Consistent Naming**
```typescript
// ✅ Consistent patterns
export const createTicket = async (data: CreateTicket) => { ... };
export const getTicketById = async (id: string) => { ... };
export const updateTicket = async (id: string, data: UpdateTicket) => { ... };
```

Happy coding! 🚀
