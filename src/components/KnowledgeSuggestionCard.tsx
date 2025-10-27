import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { KnowledgeSuggestion } from "@/services/knowledgeSuggestionService";
import { BookOpen, ThumbsDown, ThumbsUp } from "lucide-react";
import React from "react";

// ============================================================================
// Component Props
// ============================================================================

export interface KnowledgeSuggestionCardProps {
    suggestion: KnowledgeSuggestion;
    onViewDetails: () => void;
    onFeedback: (isHelpful: boolean) => void;
    showFeedback?: boolean;
    feedbackSubmitted?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const KnowledgeSuggestionCard: React.FC<KnowledgeSuggestionCardProps> = ({
    suggestion,
    onViewDetails,
    onFeedback,
    showFeedback = true,
    feedbackSubmitted = false,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [localFeedbackSubmitted, setLocalFeedbackSubmitted] = React.useState(feedbackSubmitted);

    const { entry, similarityScore, instructor } = suggestion;

    // Calculate helpful percentage if available
    const helpfulPercentage = entry.viewCount > 0
        ? Math.round((entry.helpfulCount / (entry.helpfulCount + entry.notHelpfulCount)) * 100)
        : null;

    // Truncate answer text for preview
    const PREVIEW_LENGTH = 200;
    const shouldTruncate = entry.answerText.length > PREVIEW_LENGTH;
    const displayAnswer = isExpanded || !shouldTruncate
        ? entry.answerText
        : entry.answerText.slice(0, PREVIEW_LENGTH) + "...";

    const handleFeedback = (isHelpful: boolean) => {
        setLocalFeedbackSubmitted(true);
        onFeedback(isHelpful);
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    {/* Instructor Info */}
                    <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={instructor.avatarUrl || ""} alt={instructor.fullName || "Instructor"} />
                            <AvatarFallback>
                                {instructor.fullName
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase() || "IN"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {instructor.fullName || "Instructor"}
                            </p>
                            <p className="text-xs text-muted-foreground">Instructor</p>
                        </div>
                    </div>

                    {/* Similarity Score Badge */}
                    <Badge variant="secondary" className="shrink-0">
                        {Math.round(similarityScore * 100)}% match
                    </Badge>
                </div>

                {/* Similarity Progress Bar */}
                <div className="mt-3">
                    <Progress value={similarityScore * 100} className="h-1.5" />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1.5">
                        Question
                    </h4>
                    <p className="text-base font-medium leading-relaxed">
                        {entry.questionText}
                    </p>
                </div>

                {/* Answer Text */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1.5">
                        Answer
                    </h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {displayAnswer}
                    </p>
                    {shouldTruncate && (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-0 h-auto mt-1 text-xs"
                        >
                            {isExpanded ? "Show less" : "Read more"}
                        </Button>
                    )}
                </div>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {entry.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Helpful Percentage */}
                {helpfulPercentage !== null && (entry.helpfulCount + entry.notHelpfulCount) > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>
                            {helpfulPercentage}% found this helpful ({entry.helpfulCount + entry.notHelpfulCount} {entry.helpfulCount + entry.notHelpfulCount === 1 ? "rating" : "ratings"})
                        </span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t gap-2">
                    {/* Feedback Buttons */}
                    {showFeedback && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFeedback(true)}
                                disabled={localFeedbackSubmitted}
                                className="text-xs"
                            >
                                <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                                Helpful
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFeedback(false)}
                                disabled={localFeedbackSubmitted}
                                className="text-xs"
                            >
                                <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                                Not helpful
                            </Button>
                        </div>
                    )}

                    {/* View Details Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onViewDetails}
                        className="text-xs ml-auto"
                    >
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                        View full answer
                    </Button>
                </div>

                {/* Feedback Submitted Message */}
                {localFeedbackSubmitted && (
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                        Thank you for your feedback!
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
