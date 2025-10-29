import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/NotificationBell';
import { SmartAvatar } from '@/components/SmartAvatar';
import {
  Search,
  Bell,
  Plus,
  Menu,
  ChevronUp,
  ChevronDown,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Tag,
  BarChart3,
  MessageSquare,
  X,
  Settings
} from 'lucide-react';

interface FeedLayoutProps {
  children: React.ReactNode;
  onCreateTicket?: () => void;
  user?: any;
  profile?: any;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filters?: {
    status?: string;
    priority?: string;
    type?: string;
    dateRange?: string;
  };
  onFilterChange?: (filters: any) => void;
}

export const FeedLayout = ({ children, onCreateTicket, user, profile, searchQuery, onSearchChange, filters, onFilterChange }: FeedLayoutProps) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    priority: true,
    type: true,
    dateRange: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SidebarSection = ({
    title,
    children,
    isExpanded,
    onToggle
  }: {
    title: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {children}
        </div>
      )}
    </div>
  );

  const SidebarItem = ({
    icon: Icon,
    label,
    active = false,
    onClick,
    badge
  }: {
    icon: any;
    label: string;
    active?: boolean;
    onClick?: () => void;
    badge?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );

  const FilterItem = ({
    icon: Icon,
    label,
    value,
    active = false,
    onClick
  }: {
    icon: any;
    label: string;
    value: string;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {active && (
        <X className="h-3 w-3" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-lg">EduTicket AI</span>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ticket..."
                className="pl-10"
                value={searchQuery || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onCreateTicket}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ticket Mới
            </Button>

            {user && (
              <NotificationBell userId={user.id} />
            )}

            {user && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 hover:bg-muted/50 rounded-lg p-2 transition-colors"
              >
                <SmartAvatar
                  name={profile?.full_name || user.email || 'User'}
                  avatarUrl={profile?.avatar_url}
                  size="md"
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">
                    {profile?.full_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {profile?.role || 'Student'}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Filter Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-0' : 'w-64'
          } transition-all duration-300 border-r bg-background/50 backdrop-blur-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40`}>
          <div className="p-4 space-y-6">
            {/* New Ticket Button */}
            <Button
              onClick={onCreateTicket}
              className="w-full"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ticket Mới
            </Button>

            {/* Filters */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Bộ lọc
              </h3>

              <SidebarSection
                title="Trạng thái"
                isExpanded={expandedSections.status}
                onToggle={() => toggleSection('status')}
              >
                <FilterItem
                  icon={AlertCircle}
                  label="Mở"
                  value="open"
                  active={filters?.status === 'open'}
                  onClick={() => onFilterChange?.({ ...filters, status: filters?.status === 'open' ? undefined : 'open' })}
                />
                <FilterItem
                  icon={Clock}
                  label="Đang xử lý"
                  value="in_progress"
                  active={filters?.status === 'in_progress'}
                  onClick={() => onFilterChange?.({ ...filters, status: filters?.status === 'in_progress' ? undefined : 'in_progress' })}
                />
                <FilterItem
                  icon={CheckCircle}
                  label="Đã giải quyết"
                  value="resolved"
                  active={filters?.status === 'resolved'}
                  onClick={() => onFilterChange?.({ ...filters, status: filters?.status === 'resolved' ? undefined : 'resolved' })}
                />
              </SidebarSection>

              <SidebarSection
                title="Mức độ ưu tiên"
                isExpanded={expandedSections.priority}
                onToggle={() => toggleSection('priority')}
              >
                <FilterItem
                  icon={Tag}
                  label="Thấp"
                  value="low"
                  active={filters?.priority === 'low'}
                  onClick={() => onFilterChange?.({ ...filters, priority: filters?.priority === 'low' ? undefined : 'low' })}
                />
                <FilterItem
                  icon={Tag}
                  label="Trung bình"
                  value="medium"
                  active={filters?.priority === 'medium'}
                  onClick={() => onFilterChange?.({ ...filters, priority: filters?.priority === 'medium' ? undefined : 'medium' })}
                />
                <FilterItem
                  icon={Tag}
                  label="Cao"
                  value="high"
                  active={filters?.priority === 'high'}
                  onClick={() => onFilterChange?.({ ...filters, priority: filters?.priority === 'high' ? undefined : 'high' })}
                />
                <FilterItem
                  icon={Tag}
                  label="Khẩn cấp"
                  value="critical"
                  active={filters?.priority === 'critical'}
                  onClick={() => onFilterChange?.({ ...filters, priority: filters?.priority === 'critical' ? undefined : 'critical' })}
                />
              </SidebarSection>

              <SidebarSection
                title="Loại"
                isExpanded={expandedSections.type}
                onToggle={() => toggleSection('type')}
              >
                <FilterItem
                  icon={AlertCircle}
                  label="Lỗi lập trình"
                  value="coding_error"
                  active={filters?.type === 'coding_error'}
                  onClick={() => onFilterChange?.({ ...filters, type: filters?.type === 'coding_error' ? undefined : 'coding_error' })}
                />
                <FilterItem
                  icon={Star}
                  label="Thiết lập dự án"
                  value="project_setup"
                  active={filters?.type === 'project_setup'}
                  onClick={() => onFilterChange?.({ ...filters, type: filters?.type === 'project_setup' ? undefined : 'project_setup' })}
                />
                <FilterItem
                  icon={MessageSquare}
                  label="Câu hỏi lý thuyết"
                  value="concept_question"
                  active={filters?.type === 'concept_question'}
                  onClick={() => onFilterChange?.({ ...filters, type: filters?.type === 'concept_question' ? undefined : 'concept_question' })}
                />
                <FilterItem
                  icon={BarChart3}
                  label="Bài tập"
                  value="assignment"
                  active={filters?.type === 'assignment'}
                  onClick={() => onFilterChange?.({ ...filters, type: filters?.type === 'assignment' ? undefined : 'assignment' })}
                />
              </SidebarSection>

              <SidebarSection
                title="Khoảng thời gian"
                isExpanded={expandedSections.dateRange}
                onToggle={() => toggleSection('dateRange')}
              >
                <FilterItem
                  icon={Calendar}
                  label="Hôm nay"
                  value="today"
                  active={filters?.dateRange === 'today'}
                  onClick={() => onFilterChange?.({ ...filters, dateRange: filters?.dateRange === 'today' ? undefined : 'today' })}
                />
                <FilterItem
                  icon={Calendar}
                  label="Tuần này"
                  value="week"
                  active={filters?.dateRange === 'week'}
                  onClick={() => onFilterChange?.({ ...filters, dateRange: filters?.dateRange === 'week' ? undefined : 'week' })}
                />
                <FilterItem
                  icon={Calendar}
                  label="Tháng này"
                  value="month"
                  active={filters?.dateRange === 'month'}
                  onClick={() => onFilterChange?.({ ...filters, dateRange: filters?.dateRange === 'month' ? undefined : 'month' })}
                />
              </SidebarSection>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6 pt-8">
            {/* Feed Settings */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Ticket của tôi</h1>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt feed
                </Button>
                <Badge variant="outline">5/5</Badge>
              </div>
            </div>

            {/* Feed Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
