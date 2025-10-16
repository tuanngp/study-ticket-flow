import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, RAGAssistantService } from '@/services/ragAssistantService';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    };
    getUser();
  }, []);

  // Create session when widget opens
  useEffect(() => {
    if (isOpen && !sessionId && user) {
      RAGAssistantService.createSession(user.id)
        .then(setSessionId)
        .catch(error => {
          console.error('Failed to create session:', error);
        });
    }
  }, [isOpen, sessionId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId || !user || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await RAGAssistantService.sendMessage(input, sessionId, user.id);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        metadata: { sources: response.sources },
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.';
      
      if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
        errorMessage = 'Bạn đã vượt quá giới hạn số lần hỏi. Vui lòng thử lại sau 1 giờ.';
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return null; // Don't show widget if user is not authenticated
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-primary" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Learning Assistant</h3>
            <p className="text-xs text-muted-foreground">EduTicket AI</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsOpen(false)} 
          size="icon" 
          variant="ghost"
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-8 space-y-3">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="font-medium">Xin chào! Tôi có thể giúp gì cho bạn?</p>
              <p className="text-sm">
                Hỏi về quy định, deadline, code, hoặc bất kỳ vấn đề nào khác.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <Badge variant="secondary" className="text-xs">Quy định học vụ</Badge>
                <Badge variant="secondary" className="text-xs">Hỗ trợ code</Badge>
                <Badge variant="secondary" className="text-xs">FAQs</Badge>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block max-w-[85%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                  <div className="text-xs mt-2 pt-2 border-t border-border/30 opacity-70">
                    <p className="font-medium mb-1">Nguồn tham khảo:</p>
                    {msg.metadata.sources.map((s: any, idx: number) => (
                      <div key={idx} className="truncate">
                        • {s.title} ({Math.round(s.similarity * 100)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </ScrollArea>

        <div className="border-t p-4 bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              size="icon"
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Trả lời dựa trên tài liệu nội bộ FPTU
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

