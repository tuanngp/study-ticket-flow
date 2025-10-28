import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartAvatar } from '@/components/SmartAvatar';
import { useAuth } from '@/hooks/useAuth';
import { GroupAIService, GroupService, type GroupAiSession } from '@/services/groupService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Bot, 
  Send, 
  Plus, 
  MessageSquare, 
  Users, 
  BookOpen, 
  Calendar, 
  Ticket,
  Lightbulb,
  FileText,
  Code,
  Calculator,
  Globe,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GroupAIAssistantProps {
  groupId: string;
  groupName: string;
  courseCode: string;
  className?: string;
}

export const GroupAIAssistant = ({ groupId, groupName, courseCode, className }: GroupAIAssistantProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [lastInvalidationTime, setLastInvalidationTime] = useState(0);
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set());

  // Debounced invalidation function
  const debouncedInvalidateMessages = useCallback((sessionId: string) => {
    const now = Date.now();
    if (now - lastInvalidationTime < 500) { // Prevent invalidation within 500ms
      console.log('Invalidation blocked - too soon after last invalidation');
      return;
    }
    setLastInvalidationTime(now);
    queryClient.invalidateQueries({ queryKey: ['group-ai-messages', sessionId] });
  }, [lastInvalidationTime, queryClient]);

  // Fetch group AI sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['group-ai-sessions', groupId],
    queryFn: () => GroupAIService.getGroupAISessions(groupId),
    enabled: !!groupId,
    onSuccess: (data) => {
      // Auto-select first session if none selected
      if (data && data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].session_id);
      }
    }
  });

  // Fetch current session messages with duplicate filtering
  const { data: sessionMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['group-ai-messages', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Filter out duplicate messages based on content and timestamp
      const messages = data || [];
      const uniqueMessages: any[] = [];
      const seenMessages = new Set<string>();
      
      messages.forEach((message) => {
        const messageKey = `${message.content}-${message.role}-${Math.floor(new Date(message.created_at).getTime() / 1000)}`;
        if (!seenMessages.has(messageKey)) {
          seenMessages.add(messageKey);
          uniqueMessages.push(message);
        }
      });
      
      return uniqueMessages;
    },
    enabled: !!currentSessionId,
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchInterval: false, // Don't refetch on interval
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (sessionName: string) => 
      GroupAIService.createGroupAISession(groupId, sessionName, user!.id),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['group-ai-sessions'] });
      setCurrentSessionId(session.sessionId);
      setIsCreatingSession(false);
      toast.success('New AI session created!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create session');
    },
  });

  // Send message mutation with duplicate prevention
  const sendMessageMutation = useMutation({
    mutationKey: ['send-message', currentSessionId], // Prevent duplicate mutations
    mutationFn: async (content: string) => {
      if (!currentSessionId) throw new Error('No active session');

      // Check for duplicate user message first
      const messageKey = `${content}-user-${currentSessionId}`;
      if (sentMessageIds.has(messageKey)) {
        throw new Error('Duplicate message detected');
      }
      setSentMessageIds(prev => new Set([...prev, messageKey]));

      // Send user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'user',
          content: content,
          metadata: {
            groupId,
            courseCode,
            groupName,
            userRole: profile?.role,
          }
        })
        .select()
        .single();

      if (userError) {
        // Remove from sent set if failed
        setSentMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageKey);
          return newSet;
        });
        throw userError;
      }

      // Call AI function for group context
      
      // Add timeout for AI function call with retry
      const aiCallPromise = supabase.functions.invoke('rag-assistant', {
        body: {
          query: content,
          sessionId: currentSessionId,
          userId: user!.id,
          groupContext: {
            groupId,
            groupName,
            courseCode,
            className,
            userRole: profile?.role,
          }
        }
      }).then(async (result) => {
        // If first call fails, try once more with simpler payload
        if (result.error) {
          const retryResult = await supabase.functions.invoke('rag-assistant', {
            body: {
              query: content,
              sessionId: currentSessionId,
              userId: user!.id
            }
          });
          return retryResult;
        }
        return result;
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI request timeout')), 30000); // 30 second timeout
      });

      let aiResponse, aiError;
      try {
        const result = await Promise.race([
          aiCallPromise,
          timeoutPromise
        ]) as any;
        
        aiResponse = result.data;
        aiError = result.error;
      } catch (error) {
        aiError = error;
        aiResponse = null;
      }

      if (aiError) {
        // Fallback: create a helpful response
        const fallbackResponse = {
          answer: `Xin lỗi, tôi đang gặp sự cố kỹ thuật và chưa thể trả lời câu hỏi "${content}" của bạn. Vui lòng thử lại sau hoặc tạo ticket để được hỗ trợ trực tiếp từ giảng viên/trợ giảng.`,
          metadata: { fallback: true, error: aiError.message }
        };
        
        // Save fallback response
        const { data: assistantMessage, error: assistantError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: fallbackResponse.answer,
            metadata: {
              groupId,
              courseCode,
              groupName,
              aiMetadata: fallbackResponse.metadata,
              userRole: profile?.role,
            }
          })
          .select()
          .single();

        if (assistantError) throw assistantError;
        
        // Don't invalidate - optimistic updates handled in onSuccess
        return;
      }

      // Extract response content from different possible structures
      let responseContent = '';
      if (aiResponse) {
        if (typeof aiResponse === 'string') {
          responseContent = aiResponse;
        } else if (aiResponse.response) {
          responseContent = aiResponse.response;
        } else if (aiResponse.answer) {
          responseContent = aiResponse.answer;
        } else if (aiResponse.message) {
          responseContent = aiResponse.message;
        } else if (aiResponse.text) {
          responseContent = aiResponse.text;
        } else if (aiResponse.content) {
          responseContent = aiResponse.content;
        } else {
          // Try to extract any text content from the response
          const responseStr = JSON.stringify(aiResponse);
          if (responseStr.includes('Sorry') || responseStr.includes('error')) {
            responseContent = 'Xin lỗi, tôi chưa thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
          } else {
            responseContent = 'Tôi đã nhận được yêu cầu của bạn nhưng chưa thể trả lời cụ thể. Bạn có thể hỏi lại hoặc tạo ticket để được hỗ trợ trực tiếp.';
          }
        }
      } else {
        responseContent = 'Xin lỗi, tôi chưa thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
      }

      // Clean up response content
      if (responseContent) {
        // Remove extra whitespace and newlines
        responseContent = responseContent.trim();
        // Ensure it ends with proper punctuation
        if (!responseContent.match(/[.!?]$/)) {
          responseContent += '.';
        }
      }

      // Check for duplicate AI response
      const aiMessageKey = `${responseContent}-assistant-${currentSessionId}`;
      if (sentMessageIds.has(aiMessageKey)) {
        return { userMessage, assistantMessage: null };
      }
      setSentMessageIds(prev => new Set([...prev, aiMessageKey]));

      // Save AI response
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          role: 'assistant',
          content: responseContent,
          metadata: {
            groupId,
            courseCode,
            groupName,
            aiMetadata: aiResponse?.metadata || aiResponse?.sources || {},
            userRole: profile?.role,
          }
        })
        .select()
        .single();

      if (assistantError) {
        // Remove AI message key from sent set if failed
        setSentMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(aiMessageKey);
          return newSet;
        });
        // Try to save a simple fallback message
        const { data: fallbackMessage, error: fallbackError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: 'Xin lỗi, có lỗi xảy ra khi lưu phản hồi. Vui lòng thử lại.',
            metadata: {
              groupId,
              courseCode,
              groupName,
              aiMetadata: { error: true, originalError: assistantError.message },
              userRole: profile?.role,
            }
          })
          .select()
          .single();

        if (fallbackError) {
          throw new Error('Failed to save any assistant message');
        }
        
        // Don't invalidate - optimistic updates handled in onSuccess
        return { userMessage, assistantMessage: fallbackMessage };
      }

      return { userMessage, assistantMessage };
    },
    onSuccess: (data) => {
      // Update cache optimistically instead of invalidating
      if (data?.userMessage && data?.assistantMessage) {
        queryClient.setQueryData(['group-ai-messages', currentSessionId], (oldData: any) => {
          if (!oldData) return [data.userMessage, data.assistantMessage];
          
          // Check for duplicates before adding
          const existingIds = new Set(oldData.map((msg: any) => msg.id));
          const newMessages = [];
          
          if (!existingIds.has(data.userMessage.id)) {
            newMessages.push(data.userMessage);
          }
          if (!existingIds.has(data.assistantMessage.id)) {
            newMessages.push(data.assistantMessage);
          }
          
          return [...oldData, ...newMessages];
        });
      }
      setMessage('');
      setIsProcessingMessage(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
      setIsProcessingMessage(false);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages]);

  useEffect(() => {
    if (sessions && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].sessionId);
    }
  }, [sessions, currentSessionId]);

  // Clear sent message IDs when session changes
  useEffect(() => {
    setSentMessageIds(new Set());
  }, [currentSessionId]);

  const [lastSendTime, setLastSendTime] = useState(0);

  const handleSendMessage = () => {
    const now = Date.now();
    if (now - lastSendTime < 1000) {
      return;
    }
    
    if (isProcessingMessage) {
      return;
    }
    
    if (sendMessageMutation.isPending) {
      return;
    }
    
    if (message.trim() && currentSessionId && !sendMessageMutation.isPending && !isProcessingMessage) {
      setIsProcessingMessage(true);
      setLastSendTime(now);
      const messageToSend = message.trim();
      setMessage('');
      sendMessageMutation.mutate(messageToSend);
    }
  };

  const handleCreateSession = (sessionName: string) => {
    createSessionMutation.mutate(sessionName);
  };

  const getMessageIcon = (role: string) => {
    if (role === 'assistant') {
      return <Bot className="h-4 w-4 text-blue-500" />;
    }
    return <SmartAvatar name={user?.email || 'User'} avatarUrl={profile?.avatarUrl} size="sm" />;
  };

  const getQuickActions = () => [
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: 'Course Help',
      prompt: 'Help me understand the course material for ' + courseCode,
    },
    {
      icon: <Code className="h-4 w-4" />,
      label: 'Code Review',
      prompt: 'Can you review this code and suggest improvements?',
    },
    {
      icon: <Calculator className="h-4 w-4" />,
      label: 'Problem Solving',
      prompt: 'Help me solve this problem step by step',
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Assignment Help',
      prompt: 'Help me with this assignment for ' + courseCode,
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Group Study',
      prompt: 'Suggest study strategies for our group',
    },
    {
      icon: <Lightbulb className="h-4 w-4" />,
      label: 'Project Ideas',
      prompt: 'Suggest project ideas for ' + courseCode,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Bot className="mr-2 h-4 w-4" />
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            Group AI Assistant
          </DialogTitle>
          <DialogDescription>
            AI-powered learning assistant for {groupName} ({courseCode})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Sessions Sidebar */}
          <div className="w-64 border-r pr-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sessions</h3>
              <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                      Create a new AI session for this group.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateSessionForm 
                    onSubmit={handleCreateSession}
                    isLoading={createSessionMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-48">
              {isLoadingSessions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentSessionId === session.session_id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setCurrentSessionId(session.session_id);
                      }}
                    >
                      <p className="font-medium text-sm">{session.session_name || 'Untitled Session'}</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            if (!session.created_at) return 'Unknown';
                            const date = new Date(session.created_at);
                            if (isNaN(date.getTime())) return 'Unknown';
                            return formatDistanceToNow(date);
                          } catch {
                            return 'Unknown';
                          }
                        })()} ago
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No sessions yet
                </p>
              )}
            </ScrollArea>

            {/* Quick Actions */}
            <div className="mt-6">
              <h4 className="font-semibold text-sm mb-3">Quick Actions</h4>
              <div className="space-y-2">
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setMessage(action.prompt)}
                  >
                    {action.icon}
                    <span className="ml-2 text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {currentSessionId ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    ) : sessionMessages && sessionMessages.length > 0 ? (
                      sessionMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.role === 'assistant' && (
                            <div className="flex-shrink-0">
                              {getMessageIcon(msg.role)}
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.metadata?.aiMetadata && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {msg.metadata.aiMetadata.suggestions?.map((suggestion: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {suggestion}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {msg.role === 'user' && (
                            <div className="flex-shrink-0">
                              {getMessageIcon(msg.role)}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Start a conversation with the AI assistant</p>
                        <p className="text-sm">Ask questions about your course, get help with assignments, or discuss group projects</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask the AI assistant..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !sendMessageMutation.isPending && !isProcessingMessage) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending || isProcessingMessage}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending || isProcessingMessage}
                  >
                    {sendMessageMutation.isPending || isProcessingMessage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select or create a session to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface CreateSessionFormProps {
  onSubmit: (sessionName: string) => void;
  isLoading: boolean;
}

const CreateSessionForm = ({ onSubmit, isLoading }: CreateSessionFormProps) => {
  const [sessionName, setSessionName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(sessionName || 'Untitled Session');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sessionName">Session Name</Label>
        <Input
          id="sessionName"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="e.g., Assignment Discussion, Code Review"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
};
