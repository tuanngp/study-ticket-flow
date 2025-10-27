import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import type { KnowledgeSuggestion } from "@/services/knowledgeSuggestionService";
import { KnowledgeSuggestionService } from "@/services/knowledgeSuggestionService";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import React from "react";
import { KnowledgeSuggestionCard } from "./KnowledgeSuggestionCard";

// ============================================================================
// Component Props
// ============================================================================

export interface AutoSuggestionPanelProps {
    ticketId?: string;
    questionText: string;
    courseCode?: string;
    onSuggestionApplied?: (entryId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const AutoSuggestionPanel: React.FC<AutoSuggestionPanelProps> = ({
    ticketId,
    questionText,
    courseCode,
    onSuggestionApplied,
}) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const [feedbackSubmitted, setFeedbackSubmitted] = React.useState<Set<string>>(new Set());
    const [selectedEntry, setSelectedEntry] = React.useState<KnowledgeSuggestion | null>(null);
    const [debouncedQuestionText, setDebouncedQuestionText] = React.useState(questionText);
    const { toast } = useToast();

    // Debounce question text changes (500ms delay)
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedQuestionText(questionText);
        }, 500);

        // Cancel previous search if new text entered
        return () => clearTimeout(timeoutId);
    }, [questionText]);

    // Fetch suggestions using React Query with debounced text
    const {
        data: suggestions,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["knowledge-suggestions", debouncedQuestionText, courseCode],
        queryFn: async () => {
            if (!debouncedQuestionText?.trim() || debouncedQuestionText.trim().length < 10) {
                return [];
            }
            return await KnowledgeSuggestionService.findSimilarEntries(
                debouncedQuestionText,
                courseCode
            );
        },
        enabled: !!debouncedQuestionText && debouncedQuestionText.trim().length >= 10,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });

    // Handle feedback submission
    const handleFeedback = async (entryId: string, isHelpful: boolean, similarityScore: number) => {
        if (!ticketId) {
            toast({
                title: "Cannot submit feedback",
                description: "Ticket ID is required to submit feedback",
                variant: "destructive",
            });
            return;
        }

        try {
            // Get current user session
            const session = await AuthService.getCurrentSession();
            if (!session?.user?.id) {
                toast({
                    title: "Authentication required",
                    description: "You must be logged in to submit feedback",
                    variant: "destructive",
                });
                return;
            }

            await KnowledgeSuggestionService.submitFeedback({
                entryId,
                studentId: session.user.id,
                ticketId,
                isHelpful,
                similarityScore,
            });

            // Mark feedback as submitted
            setFeedbackSubmitted((prev) => new Set(prev).add(entryId));

            // Show success toast
            toast({
                title: "Feedback submitted",
                description: "Thank you for your feedback!",
            });
        } catch (error: any) {
            console.error("Failed to submit feedback:", error);
            toast({
                title: "Failed to submit feedback",
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        }
    };

    // Handle view details
    const handleViewDetails = async (suggestion: KnowledgeSuggestion) => {
        setSelectedEntry(suggestion);

        // Track that this suggestion was viewed
        if (ticketId) {
            try {
                // Update the knowledge_suggestions table to mark as viewed
                // This is handled by the service layer
                console.log("Suggestion viewed:", suggestion.entry.id);
            } catch (error) {
                console.error("Failed to track suggestion view:", error);
            }
        }

        // Optionally call the callback
        if (onSuggestionApplied) {
            onSuggestionApplied(suggestion.entry.id);
        }
    };

    // Record suggestions when they are displayed
    React.useEffect(() => {
        const recordSuggestions = async () => {
            if (!ticketId || !suggestions || suggestions.length === 0) {
                return;
            }

            try {
                const suggestionRecords = suggestions.map((suggestion, index) => ({
                    entryId: suggestion.entry.id,
                    similarityScore: suggestion.similarityScore,
                    rank: index + 1,
                }));

                await KnowledgeSuggestionService.recordSuggestions(
                    ticketId,
                    suggestionRecords
                );
            } catch (error: any) {
                // Log error but don't show to user - this is background tracking
                console.error("Failed to record suggestions:", error);
            }
        };

        recordSuggestions();
    }, [ticketId, suggestions]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-between p-0 hover:bg-transparent"
                        >
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <CardTitle className="text-base">
                                    Suggested Answers
                                </CardTitle>
                                {!isLoading && suggestions && suggestions.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {suggestions.length}
                                    </Badge>
                                )}
                            </div>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Based on your question, here are some relevant answers from instructors.
                        </p>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="p-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                            <Skeleton className="h-3 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Error State */}
                        {isError && (
                            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                                Failed to load suggestions
                                            </p>
                                            <p className="text-xs text-red-700 dark:text-red-300">
                                                {error instanceof Error
                                                    ? error.message
                                                    : "An error occurred while searching for similar questions"}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => refetch()}
                                                className="mt-2"
                                            >
                                                Try Again
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Suggestions List */}
                        {!isLoading && !isError && suggestions && suggestions.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"} found
                                    </Badge>
                                </div>
                                {suggestions.map((suggestion) => (
                                    <KnowledgeSuggestionCard
                                        key={suggestion.entry.id}
                                        suggestion={suggestion}
                                        onViewDetails={() => handleViewDetails(suggestion)}
                                        onFeedback={(isHelpful) =>
                                            handleFeedback(
                                                suggestion.entry.id,
                                                isHelpful,
                                                suggestion.similarityScore
                                            )
                                        }
                                        showFeedback={!!ticketId}
                                        feedbackSubmitted={feedbackSubmitted.has(suggestion.entry.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !isError && suggestions && suggestions.length === 0 && (
                            <Card className="border-dashed">
                                <CardContent className="pt-6">
                                    <div className="text-center space-y-2">
                                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                                        <p className="text-sm font-medium text-muted-foreground">
                                            No suggestions found
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            We couldn't find any similar questions in the knowledge base.
                                            Your question will be answered by an instructor.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
};
