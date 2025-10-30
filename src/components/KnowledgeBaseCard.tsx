/**
 * KnowledgeBaseCard - Dashboard card for instructor knowledge base management
 * Shows summary statistics and quick access to knowledge entry management
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { KnowledgeEntryService } from '@/services/knowledgeEntryService';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Eye, ThumbsUp, TrendingUp } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface KnowledgeBaseCardProps {
    instructorId: string;
}

interface KnowledgeBaseStats {
    totalEntries: number;
    totalViews: number;
    avgHelpfulPercentage: number;
}

export const KnowledgeBaseCard: React.FC<KnowledgeBaseCardProps> = ({ instructorId }) => {
    const navigate = useNavigate();

    // Fetch instructor's knowledge entries
    const { data: entries, isLoading } = useQuery({
        queryKey: ['knowledge-entries', instructorId],
        queryFn: () => KnowledgeEntryService.getInstructorEntries(instructorId),
        enabled: !!instructorId,
    });

    // Calculate statistics
    const stats: KnowledgeBaseStats = React.useMemo(() => {
        if (!entries || entries.length === 0) {
            return {
                totalEntries: 0,
                totalViews: 0,
                avgHelpfulPercentage: 0,
            };
        }

        const totalViews = entries.reduce((sum, entry) => sum + entry.viewCount, 0);

        // Calculate average helpful percentage
        const entriesWithFeedback = entries.filter(
            entry => entry.helpfulCount + entry.notHelpfulCount > 0
        );

        let avgHelpfulPercentage = 0;
        if (entriesWithFeedback.length > 0) {
            const totalHelpfulPercentage = entriesWithFeedback.reduce((sum, entry) => {
                const totalFeedback = entry.helpfulCount + entry.notHelpfulCount;
                const helpfulPercentage = (entry.helpfulCount / totalFeedback) * 100;
                return sum + helpfulPercentage;
            }, 0);
            avgHelpfulPercentage = totalHelpfulPercentage / entriesWithFeedback.length;
        }

        return {
            totalEntries: entries.length,
            totalViews,
            avgHelpfulPercentage,
        };
    }, [entries]);

    if (isLoading) {
        return (
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Kho Kiến Thức Của Tôi
                    </CardTitle>
                    <CardDescription>
                        Quản lý câu trả lời đã lưu và các mục kiến thức
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Kho Kiến Thức Của Tôi
                </CardTitle>
                <CardDescription>
                    Quản lý câu trả lời đã lưu và các mục kiến thức
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Statistics Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                            <BookOpen className="h-5 w-5" />
                            {stats.totalEntries}
                        </div>
                        <div className="text-xs text-muted-foreground text-center mt-1">
                            Tổng Mục
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                            <Eye className="h-5 w-5" />
                            {stats.totalViews}
                        </div>
                        <div className="text-xs text-muted-foreground text-center mt-1">
                            Tổng Lượt Xem
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                            <ThumbsUp className="h-5 w-5" />
                            {stats.avgHelpfulPercentage.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground text-center mt-1">
                            TB Hữu Ích
                        </div>
                    </div>
                </div>

                {/* Empty State or Manage Button */}
                {stats.totalEntries === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">
                            Bạn chưa tạo mục kiến thức nào. Bắt đầu bằng cách trả lời ticket và lưu câu trả lời vào kho kiến thức.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/dashboard')}
                            className="w-full"
                        >
                            Xem Ticket
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => navigate('/knowledge-base')}
                        className="w-full bg-gradient-primary hover:shadow-glow"
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Quản Lý Mục
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
