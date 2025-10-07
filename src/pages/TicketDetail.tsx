import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send, User, Clock } from "lucide-react";

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
      fetchTicket();
      fetchComments();
    };

    checkAuth();
  }, [id, navigate]);

  const fetchTicket = async () => {
    const { data } = await supabase
      .from("tickets")
      .select(`
        *,
        creator:profiles!tickets_creator_id_fkey(full_name, email),
        assignee:profiles!tickets_assignee_id_fkey(full_name, email)
      `)
      .eq("id", id)
      .single();

    setTicket(data);
    setIsLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("ticket_comments")
      .select(`
        *,
        user:profiles(full_name, email)
      `)
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: id,
        user_id: user.id,
        content: newComment,
      });

    if (error) {
      toast.error("Failed to add comment");
      return;
    }

    toast.success("Comment added");
    setNewComment("");
    fetchComments();
  };

  const handleUpdateStatus = async (status: string) => {
    const { error } = await supabase
      .from("tickets")
      .update({ status: status as any })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Status updated");
    fetchTicket();
  };

  if (isLoading) {
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketDetail;
