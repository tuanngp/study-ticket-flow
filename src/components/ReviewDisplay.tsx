import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquare, Lightbulb, ThumbsUp, AlertCircle, User } from "lucide-react";
import { ReviewResult, ReviewStats, ReviewService } from "@/services/reviewService";
import { formatDistanceToNow } from "date-fns";

interface ReviewDisplayProps {
  ticketId: string;
  showStats?: boolean;
  maxReviews?: number;
}

export const ReviewDisplay = ({ 
  ticketId, 
  showStats = true, 
  maxReviews = 10 
}: ReviewDisplayProps) => {
  const [reviews, setReviews] = useState<ReviewResult[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [ticketId]);

  // Instant refresh on review created/updated events
  useEffect(() => {
    const handleCreated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.ticketId === ticketId) {
        loadReviews();
      }
    };
    const handleUpdated = handleCreated;
    window.addEventListener('review:created', handleCreated as EventListener);
    window.addEventListener('review:updated', handleUpdated as EventListener);
    return () => {
      window.removeEventListener('review:created', handleCreated as EventListener);
      window.removeEventListener('review:updated', handleUpdated as EventListener);
    };
  }, [ticketId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getTicketReviews(ticketId),
        showStats ? ReviewService.getTicketReviewStats(ticketId) : null
      ]);
      
      setReviews(reviewsData.slice(0, maxReviews));
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    }[size];

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating}/5)</span>
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (rating >= 3) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  const getCriteriaIcon = (criteria: string) => {
    const icons = {
      quality: ThumbsUp,
      completeness: AlertCircle,
      clarity: MessageSquare,
      helpfulness: Lightbulb,
      overall: Star
    };
    return icons[criteria as keyof typeof icons] || Star;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Chưa có đánh giá</h3>
          <p className="text-muted-foreground">
            Ticket này chưa có đánh giá nào từ giáo viên.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Thống kê đánh giá
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overall Stats */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating), 'lg')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.totalReviews} đánh giá
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Phân bố đánh giá</h4>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-6">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Criteria Averages */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Đánh giá theo tiêu chí</h4>
                {Object.entries(stats.criteriaAverages).map(([criteria, average]) => {
                  const Icon = getCriteriaIcon(criteria);
                  return (
                    <div key={criteria} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{criteria}</span>
                      </div>
                      <Badge className={getRatingColor(average)}>
                        {average.toFixed(1)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Đánh giá chi tiết</h3>
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewer?.avatar_url} />
                    <AvatarFallback>
                      {review.isAnonymous ? (
                        <User className="h-5 w-5" />
                      ) : (
                        review.reviewer?.full_name?.charAt(0) || 'U'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {review.isAnonymous ? 'Đánh giá ẩn danh' : review.reviewer?.full_name || 'Người dùng'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <Badge className={getRatingColor(review.overallRating)}>
                  {review.overallRating}/5
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Overall Rating */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Đánh giá tổng thể</span>
                </div>
                {renderStars(review.overallRating)}
              </div>

              {/* Individual Criteria Ratings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {review.qualityRating && (
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Chất lượng</span>
                    <Badge variant="outline" className="ml-auto">
                      {review.qualityRating}/5
                    </Badge>
                  </div>
                )}
                {review.completenessRating && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Đầy đủ</span>
                    <Badge variant="outline" className="ml-auto">
                      {review.completenessRating}/5
                    </Badge>
                  </div>
                )}
                {review.clarityRating && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Rõ ràng</span>
                    <Badge variant="outline" className="ml-auto">
                      {review.clarityRating}/5
                    </Badge>
                  </div>
                )}
                {review.helpfulnessRating && (
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Hữu ích</span>
                    <Badge variant="outline" className="ml-auto">
                      {review.helpfulnessRating}/5
                    </Badge>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {review.feedback && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Nhận xét</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {review.feedback}
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {review.suggestions && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Gợi ý cải thiện</h4>
                  <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {review.suggestions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
