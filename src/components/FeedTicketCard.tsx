import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  MessageSquare,
  Bookmark,
  Share2,
  ThumbsUp,
  MoreHorizontal,
  Tag as TagIcon,
  FileText,
  HelpCircle,
  Settings,
  Code,
  AlertTriangle,
  BookOpen,
  Award,
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
  // Maps both UI-friendly names and database enum values to display configs
  const getTicketTypeConfig = (type: string) => {
    // Map database enum to UI-friendly name for lookups
    const typeMap: Record<string, string> = {
      // Database enum -> UI-friendly name
      "bug": "coding_error",
      "task": "project_setup",
      "question": "concept_question",
      "grading": "grading_issue",
      "report": "system_issue",
      // Already UI-friendly or same
      "coding_error": "coding_error",
      "project_setup": "project_setup",
      "concept_question": "concept_question",
      "grading_issue": "grading_issue",
      "system_issue": "system_issue",
      "assignment": "assignment",
      "exam": "exam",
      "submission": "submission",
      "technical": "technical",
      "academic": "academic",
    };
    const displayType = typeMap[type] || type;

    const configs = {
      coding_error: {
        icon: Code,
        title: "Lỗi lập trình",
        subtitle: "Cần hỗ trợ kỹ thuật",
        gradient: "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-700 dark:text-red-300",
        subtextColor: "text-red-500 dark:text-red-400"
      },
      project_setup: {
        icon: Settings,
        title: "Thiết lập dự án",
        subtitle: "Hướng dẫn cài đặt",
        gradient: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        textColor: "text-blue-700 dark:text-blue-300",
        subtextColor: "text-blue-500 dark:text-blue-400"
      },
      grading_issue: {
        icon: Award,
        title: "Vấn đề điểm số",
        subtitle: "Khiếu nại điểm",
        gradient: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
        iconBg: "bg-purple-100 dark:bg-purple-900/30",
        iconColor: "text-purple-600 dark:text-purple-400",
        textColor: "text-purple-700 dark:text-purple-300",
        subtextColor: "text-purple-500 dark:text-purple-400"
      },
      concept_question: {
        icon: HelpCircle,
        title: "Câu hỏi lý thuyết",
        subtitle: "Cần giải thích",
        gradient: "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        textColor: "text-green-700 dark:text-green-300",
        subtextColor: "text-green-500 dark:text-green-400"
      },
      system_issue: {
        icon: AlertTriangle,
        title: "Lỗi hệ thống",
        subtitle: "Vấn đề kỹ thuật",
        gradient: "from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20",
        iconBg: "bg-orange-100 dark:bg-orange-900/30",
        iconColor: "text-orange-600 dark:text-orange-400",
        textColor: "text-orange-700 dark:text-orange-300",
        subtextColor: "text-orange-500 dark:text-orange-400"
      },
      assignment: {
        icon: BookOpen,
        title: "Bài tập",
        subtitle: "Hướng dẫn làm bài",
        gradient: "from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        textColor: "text-indigo-700 dark:text-indigo-300",
        subtextColor: "text-indigo-500 dark:text-indigo-400"
      },
      exam: {
        icon: FileText,
        title: "Thi cử",
        subtitle: "Hỗ trợ thi",
        gradient: "from-teal-50 to-teal-100 dark:from-teal-950/20 dark:to-teal-900/20",
        iconBg: "bg-teal-100 dark:bg-teal-900/30",
        iconColor: "text-teal-600 dark:text-teal-400",
        textColor: "text-teal-700 dark:text-teal-300",
        subtextColor: "text-teal-500 dark:text-teal-400"
      },
      default: {
        icon: FileText,
        title: "Ticket",
        subtitle: "Yêu cầu hỗ trợ",
        gradient: "from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20",
        iconBg: "bg-gray-100 dark:bg-gray-900/30",
        iconColor: "text-gray-600 dark:text-gray-400",
        textColor: "text-gray-700 dark:text-gray-300",
        subtextColor: "text-gray-500 dark:text-gray-400"
      }
    };

    return configs[displayType as keyof typeof configs] || configs.default;
  };

  const typeConfig = getTicketTypeConfig(ticket.type);

  // Helper functions for simplified badge styling
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      closed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getTypeIcon = (type: string) => {
    // Map database enum to UI-friendly name
    const typeMap: Record<string, string> = {
      "bug": "coding_error",
      "task": "project_setup",
      "question": "concept_question",
      "grading": "grading_issue",
      "report": "system_issue",
    };
    const displayType = typeMap[type] || type;

    const icons = {
      coding_error: "🐛",
      project_setup: "⚙️",
      grading_issue: "🏆",
      concept_question: "❓",
      system_issue: "⚠️",
      assignment: "📚",
      exam: "📝",
    };
    return icons[displayType as keyof typeof icons] || "📄";
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer bg-card/50 hover:bg-card border-border/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={ticket.creator?.avatar_url || ""} />
              <AvatarFallback className="text-xs">
                {ticket.creator?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{ticket.creator?.full_name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {showActions && (
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {/* Images - Display only first image, large and beautiful */}
        {ticket.images && ticket.images.length > 0 ? (
          <div className="space-y-2">
            <div className="relative">
              <img
                src={ticket.images[0]}
                alt={`Ticket image`}
                className="w-full h-64 object-cover rounded-lg"
              />
              {ticket.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  +{ticket.images.length - 1} more
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Beautiful placeholder for tickets without images - themed by type */
          (() => {
            const config = typeConfig;
            const IconComponent = config.icon;
            return (
              <div className={`relative w-full h-64 bg-gradient-to-br ${config.gradient} rounded-lg overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className={`w-16 h-16 mx-auto ${config.iconBg} rounded-full flex items-center justify-center`}>
                      <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
                    </div>
                    <div className="space-y-1">
                      <p className={`text-sm font-medium ${config.textColor}`}>{config.title}</p>
                      <p className={`text-xs ${config.subtextColor}`}>{config.subtitle}</p>
                    </div>
                  </div>
                </div>
                {/* Decorative pattern - themed colors */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${config.iconBg.replace('bg-', 'bg-').replace('/30', '/10')} rounded-full -translate-y-16 translate-x-16`}></div>
                <div className={`absolute bottom-0 left-0 w-24 h-24 ${config.iconBg.replace('bg-', 'bg-').replace('/30', '/10')} rounded-full translate-y-12 -translate-x-12`}></div>
              </div>
            );
          })()
        )}

        {/* Title and Description - Fixed height for consistency */}
        <div className="space-y-1 h-16 flex flex-col justify-center">
          <h3 className="font-bold text-xl leading-tight line-clamp-1">
            {ticket.title}
          </h3>
          
          {/* Description - Single line only */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            {ticket.description}
          </p>
        </div>

        {/* Tags - Add spacing from separator */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ticket.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <TagIcon className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {ticket.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{ticket.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Status and Priority */}
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getTypeIcon(ticket.type)} {ticket.type}
          </Badge>
        </div>

        {/* Assignee */}
        {ticket.assignee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Assigned to {ticket.assignee.full_name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span className="text-xs">12</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="text-muted-foreground"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="text-xs">...</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked(!isBookmarked);
              }}
              className={`${isBookmarked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              Comments
            </div>
            <div className="text-xs text-muted-foreground">
              Click to view full comments in ticket detail
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
