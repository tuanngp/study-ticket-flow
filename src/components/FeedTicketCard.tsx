import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  User,
  MessageSquare,
  Bookmark,
  Share2,
  ThumbsUp,
  MoreHorizontal,
  Image as ImageIcon,
  Calendar,
  Tag as TagIcon,
  FileText,
  Bug,
  Lightbulb,
  HelpCircle,
  Settings,
  Code,
  Database,
  AlertTriangle,
  CheckCircle,
  Star,
  Sparkles,
  BookOpen,
  Users,
  Zap,
  Brain,
  Target,
  Eye,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  TrendingUp,
  Activity,
  Timer,
  Award,
  Shield,
  ChevronRight,
  GraduationCap,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Heart,
  BookmarkCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedTicketCardProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    creator_id: string;
    assignee_id?: string;
    created_at: string;
    updated_at: string;
    creator?: {
      full_name?: string;
      email?: string;
      avatar_url?: string;
    };
    assignee?: {
      full_name?: string;
      email?: string;
      avatar_url?: string;
    };
    images?: string[];
    tags?: string[];
    courseCode?: string;
    className?: string;
  };
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const FeedTicketCard = ({
  ticket,
  onClick,
  onEdit,
  onDelete,
  showActions = true
}: FeedTicketCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  // Removed comment count fetching to avoid multiple API calls
  const [showComments, setShowComments] = useState(false);

  // Educational ticket type configurations
  const getTicketTypeConfig = (type: string) => {
    const configs = {
      coding_error: {
        icon: Code,
        title: "Lỗi lập trình",
        subtitle: "Cần hỗ trợ kỹ thuật",
        gradient: "from-red-50 via-red-100 to-red-200 dark:from-red-950/30 dark:via-red-900/20 dark:to-red-800/30",
        iconBg: "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/60",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-800 dark:text-red-200",
        subtextColor: "text-red-600 dark:text-red-400",
        borderColor: "border-red-200 dark:border-red-800",
        pattern: "bg-red-500/5"
      },
      project_setup: {
        icon: Settings,
        title: "Thiết lập dự án",
        subtitle: "Hướng dẫn cài đặt",
        gradient: "from-blue-50 via-blue-100 to-blue-200 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-800/30",
        iconBg: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/60",
        iconColor: "text-blue-600 dark:text-blue-400",
        textColor: "text-blue-800 dark:text-blue-200",
        subtextColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
        pattern: "bg-blue-500/5"
      },
      grading_issue: {
        icon: Award,
        title: "Vấn đề điểm số",
        subtitle: "Khiếu nại điểm",
        gradient: "from-purple-50 via-purple-100 to-purple-200 dark:from-purple-950/30 dark:via-purple-900/20 dark:to-purple-800/30",
        iconBg: "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/60",
        iconColor: "text-purple-600 dark:text-purple-400",
        textColor: "text-purple-800 dark:text-purple-200",
        subtextColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-200 dark:border-purple-800",
        pattern: "bg-purple-500/5"
      },
      concept_question: {
        icon: HelpCircle,
        title: "Câu hỏi lý thuyết",
        subtitle: "Cần giải thích",
        gradient: "from-green-50 via-green-100 to-green-200 dark:from-green-950/30 dark:via-green-900/20 dark:to-green-800/30",
        iconBg: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/60",
        iconColor: "text-green-600 dark:text-green-400",
        textColor: "text-green-800 dark:text-green-200",
        subtextColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-800",
        pattern: "bg-green-500/5"
      },
      system_issue: {
        icon: AlertTriangle,
        title: "Lỗi hệ thống",
        subtitle: "Vấn đề kỹ thuật",
        gradient: "from-orange-50 via-orange-100 to-orange-200 dark:from-orange-950/30 dark:via-orange-900/20 dark:to-orange-800/30",
        iconBg: "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/60",
        iconColor: "text-orange-600 dark:text-orange-400",
        textColor: "text-orange-800 dark:text-orange-200",
        subtextColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-orange-200 dark:border-orange-800",
        pattern: "bg-orange-500/5"
      },
      assignment: {
        icon: BookOpen,
        title: "Bài tập",
        subtitle: "Hướng dẫn làm bài",
        gradient: "from-indigo-50 via-indigo-100 to-indigo-200 dark:from-indigo-950/30 dark:via-indigo-900/20 dark:to-indigo-800/30",
        iconBg: "bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/60",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        textColor: "text-indigo-800 dark:text-indigo-200",
        subtextColor: "text-indigo-600 dark:text-indigo-400",
        borderColor: "border-indigo-200 dark:border-indigo-800",
        pattern: "bg-indigo-500/5"
      },
      exam: {
        icon: FileText,
        title: "Thi cử",
        subtitle: "Hỗ trợ thi",
        gradient: "from-teal-50 via-teal-100 to-teal-200 dark:from-teal-950/30 dark:via-teal-900/20 dark:to-teal-800/30",
        iconBg: "bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/60",
        iconColor: "text-teal-600 dark:text-teal-400",
        textColor: "text-teal-800 dark:text-teal-200",
        subtextColor: "text-teal-600 dark:text-teal-400",
        borderColor: "border-teal-200 dark:border-teal-800",
        pattern: "bg-teal-500/5"
      },
      default: {
        icon: FileText,
        title: "Ticket",
        subtitle: "Yêu cầu hỗ trợ",
        gradient: "from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950/30 dark:via-gray-900/20 dark:to-gray-800/30",
        iconBg: "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/40 dark:to-gray-800/60",
        iconColor: "text-gray-600 dark:text-gray-400",
        textColor: "text-gray-800 dark:text-gray-200",
        subtextColor: "text-gray-600 dark:text-gray-400",
        borderColor: "border-gray-200 dark:border-gray-800",
        pattern: "bg-gray-500/5"
      }
    };

    return configs[type as keyof typeof configs] || configs.default;
  };

  // Removed comment count fetching - too many API calls

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: {
        color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/30 dark:hover:border-blue-500/50",
        icon: Circle,
        label: "Thấp"
      },
      medium: {
        color: "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30 dark:hover:bg-yellow-500/30 dark:hover:border-yellow-500/50",
        icon: Circle,
        label: "Trung bình"
      },
      high: {
        color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 dark:hover:bg-orange-500/30 dark:hover:border-orange-500/50",
        icon: AlertCircle,
        label: "Cao"
      },
      critical: {
        color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/30 dark:hover:border-red-500/50",
        icon: AlertTriangle,
        label: "Khẩn cấp"
      },
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      open: {
        color: "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30 dark:hover:bg-yellow-500/30 dark:hover:border-yellow-500/50",
        icon: Circle,
        label: "Mở"
      },
      in_progress: {
        color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/30 dark:hover:border-blue-500/50",
        icon: Clock,
        label: "Đang xử lý"
      },
      resolved: {
        color: "bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/30 dark:hover:border-green-500/50",
        icon: CheckCircle2,
        label: "Đã giải quyết"
      },
      closed: {
        color: "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30 dark:hover:bg-gray-500/30 dark:hover:border-gray-500/50",
        icon: CheckCircle,
        label: "Đã đóng"
      },
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const priorityConfig = getPriorityConfig(ticket.priority);
  const statusConfig = getStatusConfig(ticket.status);
  const typeConfig = getTicketTypeConfig(ticket.type);

  return (
    <Card
      className="group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Header with user info */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-blue-100 dark:ring-blue-900/30">
              <AvatarImage src={ticket.creator?.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                {ticket.creator?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {ticket.creator?.full_name || 'Người dùng'}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {showActions && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Course info */}
        {ticket.courseCode && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
            <GraduationCap className="h-3 w-3" />
            <span className="font-medium">{ticket.courseCode}</span>
            {ticket.className && <span>• {ticket.className}</span>}
          </div>
        )}

        {/* Image or Type Placeholder */}
        {ticket.images && ticket.images.length > 0 ? (
          <div className="relative">
            <img
              src={ticket.images[0]}
              alt={`Ticket image`}
              className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
            />
            {ticket.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                +{ticket.images.length - 1} ảnh khác
              </div>
            )}
          </div>
        ) : (
          <div className={`relative w-full h-48 bg-gradient-to-br ${typeConfig.gradient} rounded-lg overflow-hidden border ${typeConfig.borderColor}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className={`w-16 h-16 mx-auto ${typeConfig.iconBg} rounded-full flex items-center justify-center shadow-lg`}>
                  <typeConfig.icon className={`w-8 h-8 ${typeConfig.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${typeConfig.textColor}`}>{typeConfig.title}</p>
                  <p className={`text-xs ${typeConfig.subtextColor}`}>{typeConfig.subtitle}</p>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${typeConfig.iconBg.replace('bg-', 'bg-').replace('/30', '/10')} rounded-full -translate-y-16 translate-x-16`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 ${typeConfig.iconBg.replace('bg-', 'bg-').replace('/30', '/10')} rounded-full translate-y-12 -translate-x-12`}></div>
          </div>
        )}

        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg leading-tight text-slate-900 dark:text-white line-clamp-2">
            {ticket.title}
          </h3>
          <div
            className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: ticket.description }}
          />
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {ticket.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{ticket.tags.length - 3} khác
              </Badge>
            )}
          </div>
        )}

        {/* Status and Priority Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${priorityConfig.color} border font-medium transition-all duration-200 cursor-pointer hover:shadow-sm`}>
            <priorityConfig.icon className="h-3 w-3 mr-1" />
            {priorityConfig.label}
          </Badge>
          <Badge className={`${statusConfig.color} border font-medium transition-all duration-200 cursor-pointer hover:shadow-sm`}>
            <statusConfig.icon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Assignee */}
        {ticket.assignee && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 rounded-lg">
            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>Được giao cho <span className="font-medium">{ticket.assignee.full_name}</span></span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`${isLiked
                ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                } transition-all duration-200 rounded-lg px-3 py-2`}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">12</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg px-3 py-2"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked(!isBookmarked);
              }}
              className={`${isBookmarked
                ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                } transition-all duration-200 rounded-lg px-3 py-2`}
            >
              <BookmarkCheck className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg px-3 py-2"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg px-3 py-2"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Bình luận
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              Nhấp để xem tất cả bình luận trong chi tiết ticket
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
