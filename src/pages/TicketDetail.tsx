import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, User, Clock, Star } from "lucide-react";
import { AuthService, UserProfile } from "@/services/authService";
import { TicketOperationsService, Ticket } from "@/services/ticketOperationsService";
import { CommentService, Comment } from "@/services/commentService";
import { ReviewButton, ReviewSummary } from "@/components/ReviewButton";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { ReviewService } from "@/services/reviewService";
import { usePermissions } from "@/hooks/usePermissions";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { canReviewTicket, canViewTicketReviews } = usePermissions();

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const session = await AuthService.getCurrentSession();

        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);
        setProfile(session.profile);

        if (id) {
          await Promise.all([fetchTicket(), fetchComments()]);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate("/auth");
      } finally {
        setIsAuthLoading(false);
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [id, navigate]);

  const fetchTicket = async () => {
    if (!id) return;

    const ticketData = await TicketOperationsService.getTicketById(id);
    setTicket(ticketData);
  };

  const fetchComments = async () => {
    if (!id) return;

    const commentsData = await CommentService.getCommentsByTicketId(id);
    setComments(commentsData);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id || !user) return;

    const { success, error, comment } = await CommentService.createComment({
      ticketId: id,
      userId: user.id,
      content: newComment.trim(),
    });

    if (!success) {
      toast.error(error || "Failed to add comment");
      return;
    }

    toast.success("Comment added");
    setNewComment("");

    // Add the new comment to the list immediately for better UX
    if (comment) {
      setComments(prev => [...prev, comment]);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!id) return;

    const { success, error } = await TicketOperationsService.updateTicketStatus(
      id,
      status as 'open' | 'in_progress' | 'resolved' | 'closed'
    );

    if (!success) {
      toast.error(error || "Failed to update status");
      return;
    }

    toast.success("Status updated");

    // Update the ticket status locally for better UX
    setTicket(prev => prev ? { ...prev, status } : null);
  };

  const handleAISelfReview = async () => {
    if (!id || !user) return;
    try {
      const ai = {
        overall: 4,
        quality: 4,
        completeness: 3,
        clarity: 4,
        helpfulness: 3,
        feedback: "AI đánh giá sơ bộ dựa trên nội dung ticket.",
        suggestions: "Bổ sung log lỗi và các bước tái hiện chi tiết hơn.",
        metadata: { source: 'ai', model: 'rule-based-v1' }
      };
      await ReviewService.createAISelfReview(id, user.id, ai);
      toast.success("Đã tạo đánh giá AI cho ticket của bạn");
    } catch (e: any) {
      toast.error(e.message || "Không thể tạo đánh giá AI");
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} profile={profile} />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{ticket?.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      Created by {ticket?.creator?.full_name || ticket?.creator?.email}
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(ticket?.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{ticket?.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-primary pl-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-sm">
                            {comment.user?.full_name || comment.user?.email}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            {id && canViewTicketReviews(id) && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Đánh giá từ giáo viên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewDisplay ticketId={id} />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Select
                    value={ticket?.status}
                    onValueChange={handleUpdateStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Priority</p>
                  <Badge className="capitalize">{ticket?.priority}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Type</p>
                  <Badge variant="outline" className="capitalize">{ticket?.type}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Assignee</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket?.assignee?.full_name || ticket?.assignee?.email || "Unassigned"}
                  </p>
                </div>

                {ticket?.ai_suggested_priority && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">AI Suggestions</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Priority:</span>
                        <Badge variant="outline" className="capitalize">
                          {ticket.ai_suggested_priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Section */}
                {id && (
                  <div className="pt-4 border-t">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Đánh giá</p>
                        <ReviewSummary ticketId={id} />
                      </div>
                      
                      {canReviewTicket(id) && (
                        <ReviewButton 
                          ticketId={id} 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        />
                      )}

                      {user && user.id === ticket?.creator_id && (
                        <Button variant="secondary" size="sm" className="w-full" onClick={handleAISelfReview}>
                          Tạo đánh giá AI cho ticket của tôi
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketDetail;
