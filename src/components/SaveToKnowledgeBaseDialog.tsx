import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/translations";
import { KnowledgeEntryService, type CreateKnowledgeEntryInput, type KnowledgeEntry } from "@/services/knowledgeEntryService";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Eye, Loader2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// ============================================================================
// Form Schema and Validation
// ============================================================================

const saveToKnowledgeBaseSchema = z.object({
    questionText: z
        .string()
        .min(1, "Question is required")
        .max(2000, "Question must be 2000 characters or less"),
    answerText: z
        .string()
        .min(1, "Answer is required")
        .max(10000, "Answer must be 10000 characters or less"),
    tags: z.string().optional(),
    visibility: z.enum(["public", "course_specific"], {
        required_error: "Please select a visibility option",
    }),
    courseCode: z.string().optional(),
}).refine(
    (data) => {
        // If visibility is course_specific, courseCode is required
        if (data.visibility === "course_specific") {
            return !!data.courseCode && data.courseCode.trim().length > 0;
        }
        return true;
    },
    {
        message: "Course code is required for course-specific visibility",
        path: ["courseCode"],
    }
);

type SaveToKnowledgeBaseFormData = z.infer<typeof saveToKnowledgeBaseSchema>;

// ============================================================================
// Component Props
// ============================================================================

export interface SaveToKnowledgeBaseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId: string;
    questionText: string;
    answerText: string;
    courseCode?: string;
    instructorId: string;
    instructorName: string;
    instructorAvatar?: string;
    onSave?: (entry: KnowledgeEntry) => void;
}

// ============================================================================
// Component
// ============================================================================

export const SaveToKnowledgeBaseDialog: React.FC<SaveToKnowledgeBaseDialogProps> = ({
    isOpen,
    onClose,
    ticketId,
    questionText,
    answerText,
    courseCode,
    instructorId,
    instructorName,
    instructorAvatar,
    onSave,
}) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showPreview, setShowPreview] = React.useState(false);

    const form = useForm<SaveToKnowledgeBaseFormData>({
        resolver: zodResolver(saveToKnowledgeBaseSchema),
        defaultValues: {
            questionText: questionText || "",
            answerText: answerText || "",
            tags: "",
            visibility: courseCode ? "course_specific" : "public",
            courseCode: courseCode || "",
        },
    });

    const visibility = form.watch("visibility");
    const watchedQuestionText = form.watch("questionText");
    const watchedAnswerText = form.watch("answerText");
    const watchedTags = form.watch("tags");

    // Reset form when dialog opens/closes
    React.useEffect(() => {
        if (isOpen) {
            form.reset({
                questionText: questionText || "",
                answerText: answerText || "",
                tags: "",
                visibility: courseCode ? "course_specific" : "public",
                courseCode: courseCode || "",
            });
            setShowPreview(false);
        }
    }, [isOpen, questionText, answerText, courseCode, form]);

    const onSubmit = async (data: SaveToKnowledgeBaseFormData) => {
        setIsSubmitting(true);

        try {
            // Parse tags from comma-separated string
            const tagsArray = data.tags
                ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                : [];

            const input: CreateKnowledgeEntryInput = {
                instructorId,
                ticketId,
                questionText: data.questionText,
                answerText: data.answerText,
                tags: tagsArray,
                visibility: data.visibility,
                courseCode: data.visibility === "course_specific" ? data.courseCode : undefined,
            };

            const createdEntry = await KnowledgeEntryService.createEntry(input);

            toast.success("Knowledge entry saved successfully!");

            if (onSave) {
                onSave(createdEntry);
            }

            onClose();
        } catch (error: any) {
            console.error("Error saving knowledge entry:", error);
            toast.error(error.message || "Failed to save knowledge entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-glass">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Save to Knowledge Base
                    </DialogTitle>
                    <DialogDescription>
                        Save this answer to help students with similar questions in the future.
                        You can edit the content before saving.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Question Field */}
                        <FormField
                            control={form.control}
                            name="questionText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter the question"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {field.value.length}/2000 characters
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Answer Field */}
                        <FormField
                            control={form.control}
                            name="answerText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Answer</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter the answer"
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {field.value.length}/10000 characters
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tags Field */}
                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., javascript, react, debugging (comma-separated)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Add up to 10 tags to help categorize this entry
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Visibility Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">Visibility</h3>

                            <FormField
                                control={form.control}
                                name="visibility"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="flex flex-col space-y-2"
                                            >
                                                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/50">
                                                    <FormControl>
                                                        <RadioGroupItem value="public" />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="font-medium">
                                                            Public
                                                        </FormLabel>
                                                        <FormDescription>
                                                            All students can see this entry
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>

                                                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 bg-muted/50">
                                                    <FormControl>
                                                        <RadioGroupItem value="course_specific" />
                                                    </FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel className="font-medium">
                                                            Course-Specific
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Only students in a specific course can see this entry
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Course Code Field (conditional) */}
                            {visibility === "course_specific" && (
                                <FormField
                                    control={form.control}
                                    name="courseCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Course Code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., CS101"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Enter the course code for this entry
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Preview Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Preview</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPreview(!showPreview)}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {showPreview ? "Hide" : "Show"} Preview
                                </Button>
                            </div>

                            {showPreview && (
                                <Card className="border-2">
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            {/* Instructor Info */}
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={instructorAvatar} alt={instructorName} />
                                                    <AvatarFallback>
                                                        {instructorName
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{instructorName}</p>
                                                    <p className="text-xs text-muted-foreground">Instructor</p>
                                                </div>
                                            </div>

                                            {/* Question */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                                    Question
                                                </h4>
                                                <p className="text-base">
                                                    {watchedQuestionText || "No question text"}
                                                </p>
                                            </div>

                                            {/* Answer */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                                    Answer
                                                </h4>
                                                <p className="text-base whitespace-pre-wrap">
                                                    {watchedAnswerText || "No answer text"}
                                                </p>
                                            </div>

                                            {/* Tags */}
                                            {watchedTags && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                                                        Tags
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {watchedTags
                                                            .split(",")
                                                            .map((tag) => tag.trim())
                                                            .filter(Boolean)
                                                            .map((tag, index) => (
                                                                <Badge key={index} variant="secondary">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Visibility Badge */}
                                            <div>
                                                <Badge variant={visibility === "public" ? "default" : "outline"}>
                                                    {visibility === "public" ? "Public" : `Course: ${form.watch("courseCode") || "N/A"}`}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("loading.saving")}
                                    </>
                                ) : (
                                    <span>{t("knowledgeBaseSection.saveToKnowledgeBase")}</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
