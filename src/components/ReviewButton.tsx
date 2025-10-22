import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Plus, CheckCircle } from "lucide-react";
import { ReviewForm } from "./ReviewForm";
import { ReviewDisplay } from "./ReviewDisplay";
import { ReviewService, ReviewResult } from "@/services/reviewService";
import { useAuth } from "@/hooks/useAuth";

interface ReviewButtonProps {
  ticketId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const ReviewButton = ({ 
  ticketId, 
  className,
  variant = "outline",
  size = "default"
}: ReviewButtonProps) => {
  const { user } = useAuth();
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);

  useEffect(() => {
    checkReviewStatus();
  }, [ticketId, user?.id]);

  const checkReviewStatus = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [canReviewTicket, existingReview] = await Promise.all([
        ReviewService.canReviewTicket(ticketId, user.id),
        ReviewService.getReviewsByReviewer(user.id).then(reviews => 
          reviews.find(r => r.ticketId === ticketId)
        )
      ]);

      setCanReview(canReviewTicket);
      setHasReviewed(!!existingReview);
      setReview(existingReview || null);
    } catch (error) {
      console.error('Failed to check review status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmitted = (newReview: ReviewResult) => {
    setReview(newReview);
    setHasReviewed(true);
    setShowReviewForm(false);
    // Refresh the review status
    checkReviewStatus();
  };

  const handleReviewUpdated = () => {
    // Refresh the review status
    checkReviewStatus();
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Star className="h-4 w-4 mr-2" />
        Đang tải...
      </Button>
    );
  }

  // Don't show review button if user can't review
  if (!canReview) {
    return null;
  }

  // If user has already reviewed, show review status
  if (hasReviewed && review) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={showReviews} onOpenChange={setShowReviews}>
          <DialogTrigger asChild>
            <Button variant={variant} size={size} className={className}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Đã đánh giá
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Đánh giá Ticket</DialogTitle>
            </DialogHeader>
            <ReviewDisplay ticketId={ticketId} />
          </DialogContent>
        </Dialog>
        
        <Badge variant="secondary" className="text-xs">
          {review.overallRating}/5
        </Badge>
      </div>
    );
  }

  // Show review form dialog
  return (
    <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Star className="h-4 w-4 mr-2" />
          Đánh giá
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá Ticket</DialogTitle>
        </DialogHeader>
        <ReviewForm
          ticketId={ticketId}
          reviewerId={user?.id || ""}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

// Review Summary Component for ticket cards
export const ReviewSummary = ({ ticketId }: { ticketId: string }) => {
  const [stats, setStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviewStats();
  }, [ticketId]);

  const loadReviewStats = async () => {
    try {
      setIsLoading(true);
      const reviewStats = await ReviewService.getTicketReviewStats(ticketId);
      setStats({
        averageRating: reviewStats.averageRating,
        totalReviews: reviewStats.totalReviews
      });
    } catch (error) {
      console.error('Failed to load review stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Star className="h-3 w-3" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
      <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
      <span className="text-muted-foreground">({stats.totalReviews})</span>
    </div>
  );
};
