import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { KnowledgeEntryService, type KnowledgeEntryFilters, type UpdateKnowledgeEntryInput } from "@/services/knowledgeEntryService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Edit, Eye, History as HistoryIcon, Loader2, Search, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

// Type that matches actual database response (snake_case)
type KnowledgeEntry = {
    id: string;
    instructor_id: string;
    ticket_id: string | null;
    question_text: string;
    answer_text: string;
    tags: string[] | null;
    question_embedding: string | null;
    visibility: "public" | "course_specific";
    course_code: string | null;
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    version: number;
    previous_version_id: string | null;
    created_at: string;
    updated_at: string;
};

// ============================================================================
// Component Props
// ============================================================================

export interface KnowledgeEntryManagerProps {
    instructorId?: string;
}

// ============================================================================
// Component
// ============================================================================

export const KnowledgeEntryManager: React.FC<KnowledgeEntryManagerProps> = ({
    instructorId: propInstructorId,
}) => {
    const { profile } = useAuth();
    const instructorId = propInstructorId || profile?.id;
    const queryClient = useQueryClient();

    // Filter state
    const [searchTerm, setSearchTerm] = React.useState("");
    const [visibilityFilter, setVisibilityFilter] = React.useState<string>("all");
    const [courseCodeFilter, setCourseCodeFilter] = React.useState<string>("all");

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = React.useState(false);
    const [editingEntry, setEditingEntry] = React.useState<KnowledgeEntry | null>(null);
    const [editForm, setEditForm] = React.useState({
        questionText: "",
        answerText: "",
        tags: "",
        visibility: "public" as "public" | "course_specific",
        courseCode: "",
    });

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [deletingEntry, setDeletingEntry] = React.useState<KnowledgeEntry | null>(null);

    // Version history dialog state
    const [versionHistoryOpen, setVersionHistoryOpen] = React.useState(false);
    const [selectedEntryForHistory, setSelectedEntryForHistory] = React.useState<KnowledgeEntry | null>(null);

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Build filters
    const filters: KnowledgeEntryFilters = React.useMemo(() => {
        const f: KnowledgeEntryFilters = {};

        if (debouncedSearchTerm) {
            f.searchTerm = debouncedSearchTerm;
        }

        if (visibilityFilter !== "all") {
            f.visibility = visibilityFilter as "public" | "course_specific";
        }

        if (courseCodeFilter !== "all") {
            f.courseCode = courseCodeFilter;
        }

        return f;
    }, [debouncedSearchTerm, visibilityFilter, courseCodeFilter]);

    // Fetch entries
    const {
        data: entries = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["knowledgeEntries", instructorId, filters],
        queryFn: () => {
            if (!instructorId) {
                throw new Error("Instructor ID is required");
            }
            return KnowledgeEntryService.getInstructorEntries(instructorId, filters);
        },
        enabled: !!instructorId,
    });

    // Extract unique course codes for filter dropdown
    const uniqueCourseCodes = React.useMemo(() => {
        const codes = new Set<string>();
        entries.forEach((entry) => {
            if (entry.course_code) {
                codes.add(entry.course_code);
            }
        });
        return Array.from(codes).sort();
    }, [entries]);

    // Calculate helpful percentage
    const calculateHelpfulPercentage = (entry: KnowledgeEntry): number => {
        const total = entry.helpful_count + entry.not_helpful_count;
        if (total === 0) return 0;
        return Math.round((entry.helpful_count / total) * 100);
    };

    // Edit mutation
    const editMutation = useMutation({
        mutationFn: async (data: { entryId: string; updates: UpdateKnowledgeEntryInput }) => {
            if (!instructorId) throw new Error("Instructor ID is required");
            return KnowledgeEntryService.updateEntry(data.entryId, instructorId, data.updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledgeEntries", instructorId] });
            toast.success("Knowledge entry updated successfully!");
            setEditDialogOpen(false);
            setEditingEntry(null);
        },
        onError: (error: any) => {
            console.error("Error updating entry:", error);
            toast.error(error.message || "Failed to update knowledge entry");
        },
    });

    // Handle edit button click
    const handleEditClick = (entry: KnowledgeEntry) => {
        setEditingEntry(entry);
        setEditForm({
            questionText: entry.question_text,
            answerText: entry.answer_text,
            tags: entry.tags?.join(", ") || "",
            visibility: entry.visibility,
            courseCode: entry.course_code || "",
        });
        setEditDialogOpen(true);
    };

    // Handle edit form submit
    const handleEditSubmit = () => {
        if (!editingEntry) return;

        const updates: UpdateKnowledgeEntryInput = {
            questionText: editForm.questionText,
            answerText: editForm.answerText,
            tags: editForm.tags
                ? editForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                : [],
            visibility: editForm.visibility,
            courseCode: editForm.visibility === "course_specific" ? editForm.courseCode : undefined,
        };

        editMutation.mutate({ entryId: editingEntry.id, updates });
    };

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (entryId: string) => {
            if (!instructorId) throw new Error("Instructor ID is required");
            return KnowledgeEntryService.deleteEntry(entryId, instructorId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledgeEntries", instructorId] });
            toast.success("Knowledge entry deleted successfully!");
            setDeleteDialogOpen(false);
            setDeletingEntry(null);
        },
        onError: (error: any) => {
            console.error("Error deleting entry:", error);
            toast.error(error.message || "Failed to delete knowledge entry");
        },
    });

    // Handle delete button click
    const handleDeleteClick = (entry: KnowledgeEntry) => {
        setDeletingEntry(entry);
        setDeleteDialogOpen(true);
    };

    // Handle delete confirm
    const handleDeleteConfirm = () => {
        if (!deletingEntry) return;
        deleteMutation.mutate(deletingEntry.id);
    };

    // Version history query
    const {
        data: versionHistory = [],
        isLoading: isLoadingHistory,
        refetch: refetchHistory,
    } = useQuery({
        queryKey: ["knowledgeEntryVersions", selectedEntryForHistory?.id],
        queryFn: () => {
            if (!selectedEntryForHistory) {
                throw new Error("Entry ID is required");
            }
            return KnowledgeEntryService.getVersionHistory(selectedEntryForHistory.id);
        },
        enabled: !!selectedEntryForHistory && versionHistoryOpen,
    });

    // Handle version history button click
    const handleViewHistory = (entry: KnowledgeEntry) => {
        setSelectedEntryForHistory(entry);
        setVersionHistoryOpen(true);
    };

    // Format date for display
    const formatDate = (dateInput: string | Date) => {
        const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    if (!instructorId) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Please log in to manage knowledge entries</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Knowledge Base</h1>
                        <p className="text-muted-foreground">
                            Manage your saved answers and knowledge entries
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions and answers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Visibility Filter */}
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Visibility</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="course_specific">Course-Specific</SelectItem>
                    </SelectContent>
                </Select>

                {/* Course Code Filter */}
                <Select value={courseCodeFilter} onValueChange={setCourseCodeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {uniqueCourseCodes.map((code) => (
                            <SelectItem key={code} value={code}>
                                {code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Entries Table */}
            <div className="border rounded-lg">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Loading entries...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <p className="text-destructive">Error loading entries</p>
                        <Button onClick={() => refetch()} variant="outline">
                            Retry
                        </Button>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-lg font-medium">No knowledge entries yet</p>
                            <p className="text-sm text-muted-foreground">
                                Start saving your ticket responses to build your knowledge base
                            </p>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Question</TableHead>
                                <TableHead>Visibility</TableHead>
                                <TableHead className="text-center">
                                    <Eye className="h-4 w-4 inline mr-1" />
                                    Views
                                </TableHead>
                                <TableHead className="text-center">Feedback</TableHead>
                                <TableHead className="text-center">Helpful %</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry) => {
                                const helpfulPercentage = calculateHelpfulPercentage(entry);
                                const totalFeedback = entry.helpful_count + entry.not_helpful_count;

                                return (
                                    <TableRow key={entry.id}>
                                        <TableCell className="max-w-md">
                                            <div className="space-y-1">
                                                <p className="font-medium line-clamp-2">
                                                    {entry.question_text}
                                                </p>
                                                {entry.tags && entry.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {entry.tags.slice(0, 3).map((tag, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        {entry.tags.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{entry.tags.length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    entry.visibility === "public" ? "default" : "outline"
                                                }
                                            >
                                                {entry.visibility === "public"
                                                    ? "Public"
                                                    : entry.course_code || "Course"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {entry.view_count}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <ThumbsUp className="h-3 w-3" />
                                                    <span className="text-sm">{entry.helpful_count}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <ThumbsDown className="h-3 w-3" />
                                                    <span className="text-sm">
                                                        {entry.not_helpful_count}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {totalFeedback > 0 ? (
                                                <span
                                                    className={
                                                        helpfulPercentage >= 70
                                                            ? "text-green-600 font-medium"
                                                            : helpfulPercentage >= 40
                                                                ? "text-yellow-600 font-medium"
                                                                : "text-red-600 font-medium"
                                                    }
                                                >
                                                    {helpfulPercentage}%
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {entry.version > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewHistory(entry)}
                                                        title="View version history"
                                                    >
                                                        <HistoryIcon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(entry)}
                                                    title="Edit entry"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(entry)}
                                                    className="text-destructive hover:text-destructive"
                                                    title="Delete entry"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <span className="text-xs text-muted-foreground">
                                                    v{entry.version}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-glass">
                    <DialogHeader>
                        <DialogTitle>Edit Knowledge Entry</DialogTitle>
                        <DialogDescription>
                            Update your knowledge entry. Changes will create a new version.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Question Field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-question">Question</Label>
                            <Textarea
                                id="edit-question"
                                placeholder="Enter the question"
                                className="min-h-[100px]"
                                value={editForm.questionText}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, questionText: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {editForm.questionText?.length || 0}/2000 characters
                            </p>
                        </div>

                        {/* Answer Field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-answer">Answer</Label>
                            <Textarea
                                id="edit-answer"
                                placeholder="Enter the answer"
                                className="min-h-[150px]"
                                value={editForm.answerText}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, answerText: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {editForm.answerText?.length || 0}/10000 characters
                            </p>
                        </div>

                        {/* Tags Field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-tags">Tags (Optional)</Label>
                            <Input
                                id="edit-tags"
                                placeholder="e.g., javascript, react, debugging (comma-separated)"
                                value={editForm.tags}
                                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                            />
                        </div>

                        {/* Visibility Section */}
                        <div className="space-y-3">
                            <Label>Visibility</Label>
                            <RadioGroup
                                value={editForm.visibility}
                                onValueChange={(value: "public" | "course_specific") =>
                                    setEditForm({ ...editForm, visibility: value })
                                }
                            >
                                <div className="flex items-center space-x-2 rounded-lg border p-3">
                                    <RadioGroupItem value="public" id="edit-public" />
                                    <Label htmlFor="edit-public" className="flex-1 cursor-pointer">
                                        <div className="font-medium">Public</div>
                                        <div className="text-sm text-muted-foreground">
                                            All students can see this entry
                                        </div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg border p-3">
                                    <RadioGroupItem
                                        value="course_specific"
                                        id="edit-course-specific"
                                    />
                                    <Label
                                        htmlFor="edit-course-specific"
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="font-medium">Course-Specific</div>
                                        <div className="text-sm text-muted-foreground">
                                            Only students in a specific course can see this entry
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>

                            {/* Course Code Field (conditional) */}
                            {editForm.visibility === "course_specific" && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-course-code">Course Code</Label>
                                    <Input
                                        id="edit-course-code"
                                        placeholder="e.g., CS101"
                                        value={editForm.courseCode}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, courseCode: e.target.value })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={editMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={
                                editMutation.isPending ||
                                !editForm.questionText?.trim() ||
                                !editForm.answerText?.trim() ||
                                (editForm.visibility === "course_specific" &&
                                    !editForm.courseCode?.trim())
                            }
                        >
                            {editMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Entry"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Knowledge Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this knowledge entry? This action cannot be
                            undone and will remove all versions of this entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deletingEntry && (
                        <div className="rounded-lg border p-4 bg-muted/50">
                            <p className="font-medium text-sm line-clamp-2">
                                {deletingEntry.question_text}
                            </p>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Version History Dialog */}
            <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-glass">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <HistoryIcon className="h-5 w-5" />
                            Version History
                        </DialogTitle>
                        <DialogDescription>
                            View all versions of this knowledge entry
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : versionHistory.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">No version history available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {versionHistory.map((version, index) => {
                                const isLatest = index === 0;
                                const previousVersion = versionHistory[index + 1];

                                return (
                                    <div
                                        key={version.id}
                                        className={`rounded-lg border p-4 ${isLatest ? "border-primary bg-primary/5" : ""
                                            }`}
                                    >
                                        {/* Version Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={isLatest ? "default" : "secondary"}>
                                                    Version {version.version}
                                                </Badge>
                                                {isLatest && (
                                                    <Badge variant="outline">Current</Badge>
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDate(version.updated_at)}
                                            </span>
                                        </div>

                                        {/* Question */}
                                        <div className="space-y-2 mb-3">
                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                Question
                                            </h4>
                                            <p className="text-sm">
                                                {version.question_text}
                                            </p>
                                            {previousVersion &&
                                                version.question_text !== previousVersion.question_text && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Modified
                                                    </Badge>
                                                )}
                                        </div>

                                        {/* Answer */}
                                        <div className="space-y-2 mb-3">
                                            <h4 className="text-sm font-semibold text-muted-foreground">
                                                Answer
                                            </h4>
                                            <p className="text-sm whitespace-pre-wrap line-clamp-4">
                                                {version.answer_text}
                                            </p>
                                            {previousVersion &&
                                                version.answer_text !== previousVersion.answer_text && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Modified
                                                    </Badge>
                                                )}
                                        </div>

                                        {/* Tags */}
                                        {version.tags && version.tags.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                <h4 className="text-sm font-semibold text-muted-foreground">
                                                    Tags
                                                </h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {version.tags.map((tag, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Visibility */}
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    version.visibility === "public" ? "default" : "outline"
                                                }
                                                className="text-xs"
                                            >
                                                {version.visibility === "public"
                                                    ? "Public"
                                                    : `Course: ${version.course_code}`}
                                            </Badge>
                                            {previousVersion &&
                                                (version.visibility !== previousVersion.visibility ||
                                                    version.course_code !== previousVersion.course_code) && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Modified
                                                    </Badge>
                                                )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVersionHistoryOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
