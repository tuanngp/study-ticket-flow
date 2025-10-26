import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, User, Clock, Star, Calendar, Edit, Trash2, Save, X } from "lucide-react";
import { AuthService, UserProfile } from "@/services/authService";
import { TicketOperationsService, Ticket } from "@/services/ticketOperationsService";
import { CommentService, Comment } from "@/services/commentService";
import { ReviewButton, ReviewSummary } from "@/components/ReviewButton";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { ReviewService } from "@/services/reviewService";
import { usePermissions } from "@/hooks/usePermissions";
import { TicketCalendarIntegration } from "@/components/TicketCalendarIntegration";

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    type: "",
    priority: "",
    courseCode: "",
    className: "",
    projectGroup: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  // Check for edit mode when ticket is loaded
  useEffect(() => {
    if (ticket) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('edit') === 'true') {
        handleEditTicket();
      }
    }
  }, [ticket]);

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

  const handleEditTicket = () => {
    if (!ticket) return;
    
    setEditData({
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priority,
      courseCode: (ticket as any).course_code || "",
      className: (ticket as any).class_name || "",
      projectGroup: (ticket as any).project_group || ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !user) return;

    try {
      const { success, error, ticket: updatedTicket } = await TicketOperationsService.updateTicket(
        id,
        editData,
        user.id
      );

      if (!success) {
        toast.error(error || "Failed to update ticket");
        return;
      }

      if (updatedTicket) {
        setTicket(updatedTicket);
      }
      
      toast.success("Ticket updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update ticket");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: "",
      description: "",
      type: "",
      priority: "",
      courseCode: "",
      className: "",
      projectGroup: ""
    });
  };

  const handleDeleteTicket = async () => {
    if (!id || !user) return;

    setIsDeleting(true);
    try {
      const { success, error } = await TicketOperationsService.deleteTicket(id, user.id);

      if (!success) {
        toast.error(error || "Failed to delete ticket");
        return;
      }

      toast.success("Ticket deleted successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete ticket");
    } finally {
      setIsDeleting(false);
    }
  };

  const canEditTicket = ticket && user && (
    ticket.creator_id === user.id || 
    ticket.assignee_id === user.id
  );

  const canDeleteTicket = ticket && user && ticket.creator_id === user.id;

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
                    {isEditing ? (
                      <div className="space-y-4">
                        <Input
                          value={editData.title}
                          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ticket title"
                          className="text-2xl font-bold"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Type</label>
                            <Select value={editData.type} onValueChange={(value) => setEditData(prev => ({ ...prev, type: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bug">Bug Report</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                                <SelectItem value="question">Question</SelectItem>
                                <SelectItem value="task">Task</SelectItem>
                                <SelectItem value="grading">Grading Issue</SelectItem>
                                <SelectItem value="assignment">Assignment Help</SelectItem>
                                <SelectItem value="technical">Technical Support</SelectItem>
                                <SelectItem value="academic">Academic Support</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Priority</label>
                            <Select value={editData.priority} onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            value={editData.courseCode}
                            onChange={(e) => setEditData(prev => ({ ...prev, courseCode: e.target.value }))}
                            placeholder="Course Code (e.g., PRJ301)"
                          />
                          <Input
                            value={editData.className}
                            onChange={(e) => setEditData(prev => ({ ...prev, className: e.target.value }))}
                            placeholder="Class Name (e.g., SE1730)"
                          />
                          <Input
                            value={editData.projectGroup}
                            onChange={(e) => setEditData(prev => ({ ...prev, projectGroup: e.target.value }))}
                            placeholder="Project Group (e.g., Team 07)"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-2xl mb-2">{ticket?.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          Created by {ticket?.creator?.full_name || ticket?.creator?.email}
                          <span>•</span>
                          <Clock className="h-4 w-4" />
                          {formatDistanceToNow(new Date(ticket?.created_at), { addSuffix: true })}
                        </CardDescription>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSaveEdit} size="sm" className="gap-2">
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm" className="gap-2">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {canEditTicket && (
                          <Button onClick={handleEditTicket} variant="outline" size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {canDeleteTicket && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Ticket</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this ticket? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => {}}>
                                  Cancel
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleDeleteTicket}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ticket description"
                    className="min-h-[200px]"
                  />
                ) : (
                  <div className="prose max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">{ticket?.description}</p>
                  </div>
                )}
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
                {/* Images Section */}
                {ticket?.images && ticket.images.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Images ({ticket.images.length})</p>
                    <div className="space-y-2">
                      {ticket.images.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer"
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setIsImageViewerOpen(true);
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`Ticket image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                              Click to view
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsCalendarOpen(true)}
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
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

      {/* Calendar Integration */}
      {id && isCalendarOpen && (
        <TicketCalendarIntegration
          ticketId={id}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsImageViewerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Image counter */}
            {ticket?.images && ticket.images.length > 1 && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {ticket.images.length}
              </div>
            )}

            {/* Main image */}
            {ticket?.images && (
              <img
                src={ticket.images[currentImageIndex]}
                alt={`Ticket image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}

            {/* Navigation buttons */}
            {ticket?.images && ticket.images.length > 1 && (
              <>
                {/* Previous button */}
                {currentImageIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}

                {/* Next button */}
                {currentImageIndex < ticket.images.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                  >
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                )}
              </>
            )}

            {/* Thumbnail strip */}
            {ticket?.images && ticket.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-full overflow-x-auto px-4">
                {ticket.images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-blue-500 opacity-100' 
                        : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketDetail;
