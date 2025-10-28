# Group Communication System

Hệ thống giao tiếp nhóm sinh viên hợp tác cho EduTicket AI với các tính năng chat realtime, quản lý ticket, và tích hợp AI assistant.

## 🚀 Tính năng chính

### 1. **Group Chat Realtime**
- Chat nhóm với Supabase Realtime
- Hỗ trợ emoji, file upload, mention thành viên
- AI assistant tích hợp song song
- Typing indicators và presence tracking

### 2. **Group Ticket System**
- Dashboard tickets dạng Kanban/List
- Tạo ticket với AI suggestions từ Gemini
- Phân loại: Group Shared, Individual, Instructor Request, Group Discussion
- Role-based permissions và approval workflow

### 3. **Notification System**
- Real-time notifications với badge đếm
- Popup hiển thị danh sách notifications
- Supabase subscription cho updates

### 4. **Group Management**
- Sidebar hiển thị danh sách nhóm
- Role management: Instructor, Class Leader, Group Leader, Member
- Permission system 4 cấp độ

## 📁 Cấu trúc thư mục

```
src/features/groups/
├── components/
│   ├── GroupChat.tsx              # Chat nhóm realtime
│   ├── GroupTicketBoard.tsx       # Dashboard tickets
│   ├── GroupTicketForm.tsx        # Form tạo ticket với AI
│   ├── GroupNotificationBell.tsx  # Notification bell
│   └── GroupSidebar.tsx           # Sidebar nhóm
├── hooks/
│   ├── useGroupChat.ts            # Hook chat realtime
│   ├── useGroupTickets.ts         # Hook quản lý tickets
│   ├── useGroupPermissions.ts     # Hook phân quyền
│   ├── useNotifications.ts        # Hook notifications
│   └── useGeminiAssistant.ts      # Hook AI assistant
├── pages/
│   └── GroupCommunicationPage.tsx # Page chính tổng hợp
├── services/
│   ├── chatApi.ts                 # API calls cho chat
│   └── ticketApi.ts               # API calls cho tickets
└── index.ts                       # Export tất cả
```

## 🛠️ Cách sử dụng

### 1. Import components

```typescript
import { 
  GroupCommunicationPage,
  GroupChat,
  GroupTicketBoard,
  GroupTicketForm,
  useGroupChat,
  useGroupTickets 
} from '@/features/groups';
```

### 2. Sử dụng trong App

```typescript
// App.tsx hoặc router
import { GroupCommunicationPage } from '@/features/groups';

function App() {
  return (
    <div className="h-screen">
      <GroupCommunicationPage />
    </div>
  );
}
```

### 3. Sử dụng hooks riêng lẻ

```typescript
// Chat hook
const {
  messages,
  sendMessage,
  sendAIMessage,
  isAIAssistantVisible,
  toggleAIAssistant
} = useGroupChat(groupId);

// Tickets hook
const {
  tickets,
  createTicket,
  updateTicket,
  approveInstructorRequest
} = useGroupTickets(groupId);

// Permissions hook
const {
  permissions,
  userRole,
  hasPermission
} = useGroupPermissions(groupId);
```

## 🔧 Cấu hình

### 1. Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 2. Supabase Setup

- Tạo bucket `group-attachments` cho file uploads
- Cấu hình RLS policies cho các bảng group
- Setup Edge Functions cho AI integration

### 3. Database Schema

Đảm bảo các bảng sau đã được tạo:
- `groups`
- `group_members`
- `group_tickets`
- `group_chat_sessions`
- `group_chat_messages`
- `notifications`

## 🎨 UI Components

### Shadcn/UI Components được sử dụng:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Input`, `Textarea`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`
- `Badge`, `Avatar`, `ScrollArea`
- `Dialog`, `Popover`, `DropdownMenu`
- `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`

### Icons từ Lucide React:
- `MessageSquare`, `Ticket`, `Users`, `Bell`
- `Send`, `Paperclip`, `Smile`, `Bot`
- `Plus`, `Filter`, `Search`, `Settings`

## 🤖 AI Integration

### Gemini API Features:
- **Ticket Suggestions**: Gợi ý title, description, priority
- **Chat Analysis**: Phân tích tin nhắn và đưa ra phản hồi
- **Learning Suggestions**: Đề xuất tài liệu học tập
- **Quick Responses**: Tạo phản hồi nhanh

### Usage:
```typescript
const { suggestTicketInfo, analyzeChatMessage } = useGeminiAssistant(groupId);

// Gợi ý ticket
const suggestions = await suggestTicketInfo(query, context);

// Phân tích chat
const response = await analyzeChatMessage(message, groupContext);
```

## 🔐 Permission System

### Roles và Permissions:

| Role | Create Tickets | Manage Members | Create Events | Grade Members | View Analytics | Manage Settings |
|------|---------------|----------------|---------------|---------------|----------------|-----------------|
| Instructor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Class Leader | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Group Leader | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Member | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Usage:
```typescript
const { hasPermission, userRole } = useGroupPermissions(groupId);

if (hasPermission('canCreateEvents')) {
  // Show create event button
}
```

## 📱 Responsive Design

- **Desktop**: Full layout với sidebar và main content
- **Tablet**: Collapsible sidebar
- **Mobile**: Stack layout với bottom navigation

## 🚀 Performance

- **Lazy Loading**: Components được load khi cần
- **Real-time Optimization**: Debounced typing indicators
- **Caching**: React Query cho data caching
- **Virtual Scrolling**: Cho danh sách messages dài

## 🧪 Testing

```bash
# Unit tests
npm test src/features/groups

# Integration tests
npm test src/features/groups -- --testPathPattern=integration

# E2E tests
npm run test:e2e -- --spec="**/groups/**"
```

## 📈 Analytics

Hệ thống tự động thu thập:
- Message count và activity
- Ticket creation và resolution rates
- User engagement metrics
- AI suggestion effectiveness

## 🔄 Real-time Updates

Tất cả components đều hỗ trợ real-time updates:
- **Chat**: New messages, typing indicators
- **Tickets**: Status changes, new tickets
- **Notifications**: New notifications
- **Presence**: User online/offline status

## 🛡️ Security

- **RLS Policies**: Row-level security cho tất cả operations
- **Input Validation**: Zod schemas cho form validation
- **File Upload**: Secure file handling với Supabase Storage
- **Permission Checks**: Server-side validation cho tất cả actions

## 📚 API Documentation

### Chat API
- `ChatApi.getOrCreateChatSession(groupId)`
- `ChatApi.sendMessage(messageData)`
- `ChatApi.uploadAttachment(file, groupId)`

### Ticket API
- `TicketApi.getGroupTickets(groupId)`
- `TicketApi.createTicket(data)`
- `TicketApi.approveInstructorRequest(groupTicketId, approvedBy)`

## 🤝 Contributing

1. Follow TypeScript conventions
2. Use Shadcn/UI components
3. Implement proper error handling
4. Add JSDoc comments
5. Write tests for new features

## 📄 License

MIT License - see LICENSE file for details.
