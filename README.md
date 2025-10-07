# Study Ticket Flow System

Hệ thống quản lý ticket học tập với AI-powered triage, được xây dựng cho môi trường giáo dục FPT University.

## 📋 Mô tả dự án

Study Ticket Flow là một ứng dụng web hiện đại giúp sinh viên và giảng viên quản lý các vấn đề, yêu cầu và nhiệm vụ trong quá trình học tập. Hệ thống tích hợp AI để tự động phân loại và gán priority cho ticket, giúp tối ưu hóa quy trình xử lý.

### ✨ Tính năng chính

- **AI-Powered Triage**: Tự động phân tích và gợi ý priority dựa trên nội dung ticket
- **Role-based Access**: Hỗ trợ 3 role: Student, Lead, Instructor
- **Real-time Updates**: Cập nhật trạng thái ticket theo thời gian thực
- **Comment System**: Hệ thống bình luận và theo dõi tiến độ
- **Dashboard Analytics**: Thống kê và báo cáo chi tiết
- **Responsive Design**: Giao diện tối ưu cho mọi thiết bị

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite + SWC
- **Package Manager**: npm/pnpm/bun

## 🚀 Hướng dẫn Setup

### Yêu cầu hệ thống

- Node.js 18+ ([Download](https://nodejs.org/))
- npm/pnpm/bun package manager
- Git

### 1. Clone repository

```bash
git clone <YOUR_GIT_URL>
cd study-ticket-flow
```

### 2. Cài đặt dependencies

```bash
# Với npm
npm install

# Với pnpm
pnpm install

# Với bun (khuyến nghị - nhanh nhất)
bun install
```

### 3. Cấu hình Supabase

#### Tạo Supabase project

1. Truy cập [supabase.com](https://supabase.com) và tạo tài khoản
2. Tạo project mới
3. Chờ project được khởi tạo xong

#### Cấu hình environment variables

Tạo file `.env.local` trong thư mục root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

**Lấy thông tin từ Supabase:**
- URL: Settings → API → Project URL
- Key: Settings → API → Project API keys → anon/public

#### Chạy database migrations

```bash
# Cài đặt Supabase CLI
npm install -g supabase

# Login vào Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Chạy migrations
supabase db push
```

**Hoặc import SQL file:**
- Vào Supabase Dashboard → SQL Editor
- Copy nội dung file `supabase/migrations/20251007030639_840041cb-20aa-4565-bf66-d3610f6a9dd7.sql`
- Chạy query

### 4. Cấu hình AI Triage (tùy chọn)

Tạo Supabase Edge Function cho AI triage:

1. Vào Supabase Dashboard → Edge Functions
2. Tạo function mới tên `ai-triage`
3. Copy code từ `supabase/functions/ai-triage/index.ts`
4. Cấu hình AI API key (OpenAI/Gemini/etc.)

### 5. Chạy development server

```bash
# Với npm
npm run dev

# Với pnpm
pnpm dev

# Với bun
bun run dev
```

Server sẽ chạy tại `http://localhost:8080`

## 📁 Cấu trúc dự án

```
src/
├── components/           # UI Components
│   ├── ui/              # shadcn/ui components
│   ├── Navbar.tsx       # Navigation bar
│   ├── StatsCards.tsx   # Dashboard statistics
│   ├── TicketList.tsx   # Ticket listing component
│   └── ...
├── pages/               # Page components
│   ├── Index.tsx        # Landing page
│   ├── Auth.tsx         # Authentication
│   ├── Dashboard.tsx    # Main dashboard
│   ├── TicketDetail.tsx # Ticket detail view
│   ├── NewTicket.tsx    # Create ticket form
│   └── NotFound.tsx     # 404 page
├── services/            # Business logic layer
│   ├── authService.ts           # Authentication
│   ├── ticketService.ts         # Ticket operations + AI
│   ├── ticketOperationsService.ts # CRUD operations
│   ├── commentService.ts        # Comment management
│   ├── statisticsService.ts     # Analytics
│   └── README.md               # Services documentation
├── hooks/               # Custom React hooks
├── lib/                 # Utilities
│   └── utils.ts         # Helper functions
├── integrations/        # External integrations
│   └── supabase/        # Supabase client & types
└── main.tsx            # App entry point
```

## 🏗️ Kiến trúc ứng dụng

### Database Schema

#### Tables

- **profiles**: Thông tin user (id, email, full_name, role, avatar)
- **tickets**: Thông tin ticket (title, description, type, priority, status, assignee, creator, AI suggestions)
- **ticket_comments**: Bình luận cho ticket

#### Enums

- **user_role**: `student | lead | instructor`
- **ticket_type**: `bug | feature | question | task`
- **ticket_priority**: `low | medium | high | critical`
- **ticket_status**: `open | in_progress | resolved | closed`

### Services Layer

Hệ thống sử dụng pattern Service Layer để tách biệt business logic:

```typescript
// Ví dụ sử dụng TicketService
import { TicketService } from '@/services/ticketService';

const ticket = await TicketService.createTicket(formData, userId);
```

**Các service chính:**
- `AuthService`: Xử lý authentication
- `TicketService`: Tạo ticket với AI triage
- `TicketOperationsService`: CRUD operations + real-time subscriptions
- `CommentService`: Quản lý comments
- `StatisticsService`: Thống kê và analytics

### State Management

Sử dụng React Query cho server state management:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data: tickets, isLoading } = useQuery({
  queryKey: ['tickets'],
  queryFn: TicketOperationsService.getTickets
});

// Mutations
const createTicket = useMutation({
  mutationFn: (data) => TicketService.createTicket(data, userId)
});
```

## 💻 Development Workflow

### Code Style & Conventions

#### Naming Conventions

- **Components**: PascalCase (`TicketList.tsx`)
- **Files**: kebab-case hoặc camelCase (`ticketService.ts`)
- **Functions/Variables**: camelCase (`getTickets`, `ticketData`)
- **Types/Interfaces**: PascalCase (`TicketFormData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

#### Import Order

```typescript
// 1. React imports
import React from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';

// 3. Local imports - absolute path
import { Button } from '@/components/ui/button';

// 4. Local imports - relative path
import { TicketService } from '../services/ticketService';
```

#### Component Structure

```typescript
import { FC } from 'react';

interface ComponentProps {
  // Props interface
}

export const ComponentName: FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Custom hooks
  // State management
  // Event handlers
  // Effects

  return (
    // JSX
  );
};
```

### Git Workflow

1. **Branch naming**: `feature/feature-name`, `fix/bug-name`, `docs/update-readme`
2. **Commit messages**: `feat: add ticket filtering`, `fix: resolve auth issue`
3. **Pull requests**: Mô tả chi tiết thay đổi và testing steps

### Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Scripts

```json
{
  "dev": "vite",                    // Development server
  "build": "vite build",            // Production build
  "build:dev": "vite build --mode development",  // Dev build
  "lint": "eslint .",               // Code linting
  "preview": "vite preview"         // Preview production build
}
```

## 🚀 Deployment

### Với Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Với Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Liên hệ
- **GitHub Issues**: Báo bug và yêu cầu tính năng mới

---

*Built with ❤️ for FPT University students and instructors*
