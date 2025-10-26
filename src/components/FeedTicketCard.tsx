import { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommentService } from '@/services/commentService';

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
  const [commentCount, setCommentCount] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Get placeholder config based on ticket type
  const getPlaceholderConfig = (type: string) => {
    const configs = {
      bug: {
        icon: Bug,
        title: "Bug Report",
        subtitle: "No screenshot available",
        gradient: "from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20",
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        textColor: "text-red-700 dark:text-red-300",
        subtextColor: "text-red-500 dark:text-red-400"
      },
      feature: {
        icon: Lightbulb,
        title: "Feature Request",
        subtitle: "No mockup available",
        gradient: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        textColor: "text-blue-700 dark:text-blue-300",
        subtextColor: "text-blue-500 dark:text-blue-400"
      },
      task: {
        icon: CheckCircle,
        title: "Task",
        subtitle: "No visual reference",
        gradient: "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20",
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        textColor: "text-green-700 dark:text-green-300",
        subtextColor: "text-green-500 dark:text-green-400"
      },
      question: {
        icon: HelpCircle,
        title: "Question",
        subtitle: "No diagram available",
        gradient: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
        iconBg: "bg-purple-100 dark:bg-purple-900/30",
        iconColor: "text-purple-600 dark:text-purple-400",
        textColor: "text-purple-700 dark:text-purple-300",
        subtextColor: "text-purple-500 dark:text-purple-400"
      },
      enhancement: {
        icon: Star,
        title: "Enhancement",
        subtitle: "No preview available",
        gradient: "from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20",
        iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        textColor: "text-yellow-700 dark:text-yellow-300",
        subtextColor: "text-yellow-500 dark:text-yellow-400"
      },
      default: {
        icon: FileText,
        title: "No Image",
        subtitle: "Text-based ticket",
        gradient: "from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20",
        iconBg: "bg-gray-100 dark:bg-gray-900/30",
        iconColor: "text-gray-600 dark:text-gray-400",
        textColor: "text-gray-700 dark:text-gray-300",
        subtextColor: "text-gray-500 dark:text-gray-400"
      }
    };

    return configs[type as keyof typeof configs] || configs.default;
  };


  // Fetch comment count for this ticket
  useEffect(() => {
    const fetchCommentCount = async () => {
      setIsLoadingComments(true);
      try {
        const comments = await CommentService.getCommentsByTicketId(ticket.id);
        setCommentCount(comments.length);
      } catch (error) {
        console.error('Error fetching comment count:', error);
        setCommentCount(0);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchCommentCount();

    // Subscribe to comment changes for real-time updates
    const unsubscribe = CommentService.subscribeToComments(ticket.id, () => {
      fetchCommentCount();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [ticket.id]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      resolved: "bg-green-500/10 text-green-500 border-green-500/20",
      closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      bug: "🐛",
      feature: "✨",
      question: "❓",
      task: "📋",
      grading: "📊",
      report: "📝",
      config: "⚙️",
      assignment: "📚",
      exam: "📝",
      submission: "📤",
      technical: "🔧",
      academic: "🎓",
    };
    return icons[type as keyof typeof icons] || "📋";
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
            const config = getPlaceholderConfig(ticket.type);
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
              disabled={isLoadingComments}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {isLoadingComments ? '...' : commentCount}
              </span>
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
              Comments ({commentCount})
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
