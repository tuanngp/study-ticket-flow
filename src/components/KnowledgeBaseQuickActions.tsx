/**
 * KnowledgeBaseQuickActions - Quick access panel for knowledge base management
 * Shows recent entries with edit/delete actions and entries needing attention
 */

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type KnowledgeEntry } from '@/db/schema';
import { KnowledgeEntryService } from '@/services/knowledgeEntryService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    BookOpen,
    Edit,
    ExternalLink,
    Eye,
    ThumbsUp,
    Trash2
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KnowledgeBaseQuickActionsProps {
    instructorId: string;
}

export const KnowledgeBaseQuickActions: React.FC<KnowledgeBaseQuickActionsProps> = ({
    instructorId
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

    // Fetch instructor's knowledge entries
    const { data: entries, isLoading } = useQuery({
        queryKey: ['knowledge-entries', instructorId],
        queryFn: () => KnowledgeEntryService.getInstructorEntries(instructorId),
        enabled: !!instructorId,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (entryId: string) =>
            KnowledgeEntryService.deleteEntry(entryId, instructorId),
        onSuccess: () => {
            toast.success('Knowledge entry deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['knowledge-entries', instructorId] });
            setDeleteDialogOpen(false);
            setEntryToDelete(null);
        },
        onError: (error: any) => {
            toast.error(`Failed to delete entry: ${error.message}`);
        },
    });

    // Get recent entries (last 5)
    const recentEntries = React.useMemo(() => {
        if (!entries) return [];
        return [...entries]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
    }, [entries]);

    // Get entries needing attention (low helpful %, threshold: < 50%)
    const entriesNeedingAttention = React.useMemo(() => {
        if (!entries) return [];
        return entries.filter(entry => {
            const totalFeedback = entry.helpfulCount + entry.notHelpfulCount;
            if (totalFeedback < 3) return false; // Need at least 3 feedback items
            const helpfulPercentage = (entry.helpfulCount / totalFeedback) * 100;
            return helpfulPercentage < 50;
        }).slice(0, 3); // Show top 3
    }, [entries]);

    const handleDelete = (entryId: string) => {
        setEntryToDelete(entryId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (entryToDelete) {
            deleteMutation.mutate(entryToDelete);
        }
    };

    const handleEdit = (entryId: string) => {
        navigate(`/knowledge-base?edit=${entryId}`);
    };

    const getHelpfulPercentage = (entry: KnowledgeEntry): number => {
        const totalFeedback = entry.helpfulCount + entry.notHelpfulCount;
        if (totalFeedback === 0) return 0;
        return (entry.helpfulCount / totalFeedback) * 100;
    };

    const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    if (isLoading) {
        return (
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                    <CardDescription>
                        Manage your recent knowledge entries
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!entries || entries.length === 0) {
        return null; // Don't show if no entries
    }

    return (
        <>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                    <CardDescription>
                        Manage your recent knowledge entries
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Recent Entries */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            Recent Entries
                            <Badge variant="secondary" className="text-xs">
                                {recentEntries.length}
                            </Badge>
                        </h4>
                        <div className="space-y-2">
                            {recentEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {truncateText(entry.questionText, 60)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {entry.viewCount}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    {getHelpfulPercentage(entry).toFixed(0)}%
                                                </span>
                                                <Badge
                                                    variant={entry.visibility === 'public' ? 'default' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {entry.visibility === 'public' ? 'Public' : entry.courseCode}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(entry.id)}
                                                className="h-7 w-7 p-0"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(entry.id)}
                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Entries Needing Attention */}
                    {entriesNeedingAttention.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-600">
                                <AlertCircle className="h-4 w-4" />
                                Needs Attention
                                <Badge variant="destructive" className="text-xs">
                                    {entriesNeedingAttention.length}
                                </Badge>
                            </h4>
                            <div className="space-y-2">
                                {entriesNeedingAttention.map((entry) => {
                                    const helpfulPercentage = getHelpfulPercentage(entry);
                                    const totalFeedback = entry.helpfulCount + entry.notHelpfulCount;

                                    return (
                                        <div
                                            key={entry.id}
                                            className="p-3 border border-orange-200 bg-orange-50/50 rounded-lg"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {truncateText(entry.questionText, 50)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-orange-700 font-medium">
                                                            {helpfulPercentage.toFixed(0)}% helpful
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({totalFeedback} feedback)
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(entry.id)}
                                                    className="h-7 text-xs"
                                                >
                                                    Review
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* View All Button */}
                    <Button
                        variant="outline"
                        onClick={() => navigate('/knowledge-base')}
                        className="w-full"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View All Entries
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Knowledge Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this knowledge entry? This action cannot be undone.
                            Students will no longer see this entry in suggestions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEntryToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
