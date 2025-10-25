# Drizzle ORM Setup với Supabase

## Cài đặt

1. Cài đặt Drizzle ORM:
```bash
npm install drizzle-orm drizzle-kit @types/better-sqlite3 better-sqlite3
```

2. Tạo file `.env` với DATABASE_URL:
```bash
# Lấy connection string từ Supabase Dashboard > Settings > Database
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

## Cách sử dụng

### 1. Định nghĩa Schema
Chỉnh sửa file `src/db/schema.ts` để định nghĩa các bảng và quan hệ.

### 2. Generate Migration
```bash
npm run db:generate
```

### 3. Áp dụng Migration lên Database
```bash
npm run db:push
```

### 4. Generate Types từ Database (tùy chọn)
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types-new.ts
```

## Workflow đề xuất

1. **Thay đổi Schema**: Chỉnh sửa `src/db/schema.ts`
2. **Generate Migration**: `npm run db:generate`
3. **Review Migration**: Kiểm tra file SQL trong `supabase/migrations/`
4. **Apply Migration**: `npm run db:push` hoặc dùng Supabase CLI
5. **Update Types**: Generate lại types nếu cần

## Lưu ý

- Drizzle sẽ generate SQL migration tương thích với Supabase
- Bạn vẫn có thể sử dụng Supabase CLI để manage database
- Migration files được lưu trong `supabase/migrations/` như bình thường
