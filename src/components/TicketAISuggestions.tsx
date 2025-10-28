/**
 * TicketAISuggestions - Component hiển thị AI suggestions cho ticket
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestedAnswer, TicketAutoResponseService } from "@/services/ticketAutoResponseService";
import { BookOpen, CheckCircle2, Copy, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface TicketAISuggestionsProps {
    ticketId: string;
    ticketTitle: string;
    ticketDescription: string;
    courseCode?: string;
    userId: string;
    onApplySuggestion?: (answer: string) => void;
}

export const TicketAISuggestions = ({
    ticketId,
    ticketTitle,
    ticketDescription,
    courseCode,
    userId,
    onApplySuggestion
}: TicketAISuggestionsProps) => {
    const [suggestions, setSuggestions] = useState<SuggestedAnswer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [ratedSuggestions, setRatedSuggestions] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadSuggestions();
    }, [ticketId]);

    const loadSuggestions = async () => {
        setIsLoading(true);
        try {
            const result = await TicketAutoResponseService.getSuggestedAnswers(
                ticketId,
                ticketTitle,
                ticketDescription,
                courseCode
            );

            if (result.success) {
                setSuggestions(result.suggestions);
            } else {
                console.error('Failed to load suggestions:', result.error);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewSuggestion = async (suggestion: SuggestedAnswer) => {
        if (expandedId === suggestion.id) {
            setExpandedId(null);
        } else {
            setExpandedId(suggestion.id);

            // Mark as viewed
            if (suggestion.source === 'knowledge_base') {
                await TicketAutoResponseService.markSuggestionViewed(ticketId, suggestion.id);
            }
        }
    };

    const handleCopySuggestion = (answer: string) => {
        navigator.clipboard.writeText(answer);
        toast.success("Đã copy câu trả lời");
    };

    const handleApplySuggestion = (answer: string) => {
        if (onApplySuggestion) {
            onApplySuggestion(answer);
            toast.success("Đã áp dụng câu trả lời gợi ý");
        }
    };

    const handleRateSuggestion = async (suggestion: SuggestedAnswer, isHelpful: boolean) => {
        if (suggestion.source !== 'knowledge_base') return;

        try {
            await TicketAutoResponseService.rateSuggestion(
                ticketId,
                suggestion.id,
                isHelpful,
                userId
            );

            setRatedSuggestions(prev => new Set(prev).add(suggestion.id));
            toast.success(isHelpful ? "Cảm ơn phản hồi của bạn!" : "Chúng tôi sẽ cải thiện");
        } catch (error) {
            toast.error("Không thể gửi đánh giá");
        }
    };

    const getConfidenceBadge = (confidence: string) => {
        const variants = {
            high: { variant: "default" as const, label: "Độ tin cậy cao", color: "bg-green-500" },
            medium: { variant: "secondary" as const, label: "Độ tin cậy trung bình", color: "bg-yellow-500" },
            low: { variant: "outline" as const, label: "Độ tin cậy thấp", color: "bg-gray-500" }
        };

        const config = variants[confidence as keyof typeof variants];
        return (
            <Badge variant={config.variant} className="gap-1">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.label}
            </Badge>
        );
    };

    const getSourceBadge = (source: string) => {
        if (source === 'knowledge_base') {
            return (
                <Badge variant="default" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    Knowledge Base
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                RAG Documents
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        AI đang tìm câu trả lời...
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (suggestions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        Gợi ý từ AI
                    </CardTitle>
                    <CardDescription>
                        Không tìm thấy câu trả lời tương tự. Hãy tạo ticket và giảng viên sẽ trả lời sớm.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Gợi ý câu trả lời từ AI
                </CardTitle>
                <CardDescription>
                    Tìm thấy {suggestions.length} câu trả lời tương tự. Click để xem chi tiết.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {suggestions.map((suggestion, index) => (
                    <Card
                        key={suggestion.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleViewSuggestion(suggestion)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            #{index + 1}
                                        </span>
                                        {getSourceBadge(suggestion.source)}
                                        {getConfidenceBadge(suggestion.confidence)}
                                    </div>
                                    <CardTitle className="text-base">
                                        {suggestion.questionText}
                                    </CardTitle>
                                </div>
                            </div>

                            {suggestion.metadata && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                    {suggestion.metadata.instructorName && (
                                        <span>👨‍🏫 {suggestion.metadata.instructorName}</span>
                                    )}
                                    {suggestion.metadata.courseCode && (
                                        <Badge variant="outline" className="text-xs">
                                            {suggestion.metadata.courseCode}
                                        </Badge>
                                    )}
                                    {suggestion.metadata.chunkCount && suggestion.metadata.chunkCount > 1 && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            Tổng hợp từ {suggestion.metadata.chunkCount} đoạn
                                        </Badge>
                                    )}
                                    {suggestion.metadata.helpfulCount !== undefined && (
                                        <span className="flex items-center gap-1">
                                            <ThumbsUp className="h-3 w-3" />
                                            {suggestion.metadata.helpfulCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </CardHeader>

                        {expandedId === suggestion.id && (
                            <CardContent className="pt-0 space-y-3">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <ReactMarkdown>{suggestion.answerText}</ReactMarkdown>
                                </div>

                                {suggestion.metadata?.tags && suggestion.metadata.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {suggestion.metadata.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApplySuggestion(suggestion.answerText);
                                        }}
                                        className="gap-2"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Áp dụng
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopySuggestion(suggestion.answerText);
                                        }}
                                        className="gap-2"
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </Button>

                                    {suggestion.source === 'knowledge_base' && !ratedSuggestions.has(suggestion.id) && (
                                        <div className="ml-auto flex items-center gap-1">
                                            <span className="text-xs text-muted-foreground mr-2">Hữu ích?</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRateSuggestion(suggestion, true);
                                                }}
                                                className="gap-1 h-8 px-2"
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRateSuggestion(suggestion, false);
                                                }}
                                                className="gap-1 h-8 px-2"
                                            >
                                                <ThumbsDown className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {ratedSuggestions.has(suggestion.id) && (
                                        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Đã đánh giá
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
};
