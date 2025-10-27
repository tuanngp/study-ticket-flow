import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadService } from "@/services/imageUploadService";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Bug,
  CheckCircle,
  Clock,
  Code,
  FileText,
  HelpCircle,
  Lightbulb,
  Loader2,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  Star,
  Target,
  Upload,
  Users,
  X,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AIAutoComplete } from "./AIAutoComplete";
import { AutoSuggestionPanel } from "./AutoSuggestionPanel";
import { CodeRunner } from "./CodeRunner";
import { EnhancedTicketTemplates } from "./EnhancedTicketTemplates";
import { ImageUpload } from "./ImageUpload";
import { RichTextEditor } from "./RichTextEditor";
import { ValidationMessage } from "./ValidationMessage";

interface UnifiedTicketCreationProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export const UnifiedTicketCreation = ({ onSubmit, onCancel, initialData }: UnifiedTicketCreationProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    code: initialData?.code || "",
    type: initialData?.type || "task",
    priority: initialData?.priority || "medium",
    courseCode: initialData?.courseCode || "",
    className: initialData?.className || "",
    projectGroup: initialData?.projectGroup || "",
    tags: initialData?.tags || [],
    images: initialData?.images || [],
    estimatedTime: initialData?.estimatedTime || "1-2 hours",
    urgency: initialData?.urgency || "medium",
    ...initialData
  });

  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("quick");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  // Basic ticket types (always visible)
  const basicTicketTypes = [
    { value: "bug", label: "Bug Report", icon: <Bug className="h-4 w-4" />, color: "bg-red-500", description: "Report errors and issues" },
    { value: "feature", label: "Feature Request", icon: <Lightbulb className="h-4 w-4" />, color: "bg-blue-500", description: "Request new functionality" },
    { value: "question", label: "Question", icon: <HelpCircle className="h-4 w-4" />, color: "bg-green-500", description: "Ask for help or clarification" },
    { value: "task", label: "Task", icon: <Settings className="h-4 w-4" />, color: "bg-purple-500", description: "General task or request" }
  ];

  // Educational ticket types (shown when expanded)
  const educationalTicketTypes = [
    { value: "grading", label: "Grading Issue", icon: <Star className="h-4 w-4" />, color: "bg-yellow-500", description: "Question about grades or scoring" },
    { value: "report", label: "Report Problem", icon: <FileText className="h-4 w-4" />, color: "bg-orange-500", description: "Report academic or system issues" },
    { value: "config", label: "Configuration", icon: <Settings className="h-4 w-4" />, color: "bg-indigo-500", description: "Setup or configuration help" },
    { value: "assignment", label: "Assignment Help", icon: <BookOpen className="h-4 w-4" />, color: "bg-teal-500", description: "Help with assignments or projects" },
    { value: "exam", label: "Exam Related", icon: <Target className="h-4 w-4" />, color: "bg-pink-500", description: "Questions about exams or tests" },
    { value: "submission", label: "Submission Issue", icon: <Upload className="h-4 w-4" />, color: "bg-cyan-500", description: "Problems with file submissions" },
    { value: "technical", label: "Technical Support", icon: <Code className="h-4 w-4" />, color: "bg-gray-500", description: "Technical difficulties or setup" },
    { value: "academic", label: "Academic Support", icon: <Users className="h-4 w-4" />, color: "bg-emerald-500", description: "General academic assistance" }
  ];

  // All ticket types for reference
  const allTicketTypes = [...basicTicketTypes, ...educationalTicketTypes];

  const priorities = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800 border-green-200", description: "Can wait" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200", description: "Normal priority" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800 border-orange-200", description: "Important" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-800 border-red-200", description: "Urgent" }
  ];

  const urgencies = [
    { value: "low", label: "Low", description: "Can wait a few days", icon: <Clock className="h-4 w-4" /> },
    { value: "medium", label: "Medium", description: "Needs attention this week", icon: <Target className="h-4 w-4" /> },
    { value: "high", label: "High", description: "Needs attention today", icon: <AlertTriangle className="h-4 w-4" /> },
    { value: "critical", label: "Critical", description: "Blocks other work", icon: <Zap className="h-4 w-4" /> }
  ];

  const estimatedTimes = [
    "15-30 min", "30-60 min", "1-2 hours", "2-4 hours", "4-8 hours", "1-2 days", "2-3 days", "1 week+"
  ];

  const commonTags = [
    "java", "javascript", "react", "database", "api", "ui", "bug", "feature", "setup", "documentation",
    "performance", "security", "testing", "deployment", "configuration", "authentication", "frontend", "backend"
  ];

  // Auto-analyze when form data changes
  useEffect(() => {
    const analyzeTicket = async () => {
      const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
      if (formData.title.length > 10 && descriptionText.length > 20) {
        setIsAnalyzing(true);
        try {
          // Call real AI triage service
          const { TicketService } = await import('@/services/ticketService');
          const suggestions = await TicketService.getAITriageSuggestions({
            title: formData.title,
            description: formData.description,
            type: formData.type,
            priority: formData.priority
          });

          if (suggestions) {
            setAiSuggestions(suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('AI analysis failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    const timeoutId = setTimeout(analyzeTicket, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors({});

    // Validate form data before submission
    const errors: { title?: string; description?: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề là bắt buộc';
    }

    // Check if description has meaningful content (not just HTML tags)
    const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
    if (!descriptionText) {
      errors.description = 'Mô tả là bắt buộc';
    }

    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsCreating(true);
    try {
      // Upload images if any
      let processedFormData = { ...formData };
      if (formData.images && formData.images.length > 0) {
        console.log('Uploading images:', formData.images);
        try {
          const imageUrls = await ImageUploadService.uploadImages(formData.images);
          processedFormData.images = imageUrls;
          console.log('Uploaded image URLs:', imageUrls);
        } catch (error) {
          console.error('Image upload failed:', error);
          toast.error('Failed to upload images. Please try again.');
          return;
        }
      }

      await onSubmit(processedFormData);
    } catch (error) {
      // Error is handled by parent component or displayed via toast/alert
      console.error('Error submitting ticket:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTemplateSelect = (template: any) => {
    // Convert markdown to HTML for better display in rich text editor
    const convertMarkdownToHTML = (markdown: string) => {
      return markdown
        // Bold text with theme-aware color
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-red-500 dark:text-red-400">$1</strong>')
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bullet points
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        // Numbered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        // Wrap in paragraphs
        .replace(/^(?!<[pli])/gm, '<p>')
        .replace(/(?<!>)$/gm, '</p>')
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<li>.*<\/li>)<\/p>/g, '<ul>$1</ul>')
        .replace(/<ul>(<li>.*<\/li>)<\/ul>/g, '<ul>$1</ul>');
    };

    setFormData(prev => ({
      ...prev,
      title: template.content.title,
      description: convertMarkdownToHTML(template.content.description),
      type: template.type,
      priority: template.priority,
      tags: template.tags || [],
      estimatedTime: template.estimatedTime || "1-2 hours"
    }));
    setShowTemplates(false);
    setActiveTab("preview");

    // Show success message
    toast.success("Template applied successfully!", {
      description: "You can now customize the content as needed."
    });
  };

  const getTypeIcon = (type: string) => {
    return allTicketTypes.find(t => t.value === type)?.icon || <Settings className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    return allTicketTypes.find(t => t.value === type)?.color || "bg-gray-500";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Ticket
              </CardTitle>
              <CardDescription>
                Choose your preferred creation method - from quick templates to detailed forms
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="quick">Quick Start</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="quick" className="space-y-6">
                {/* Quick Start - Simple form with AI */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Quick Ticket Creation</h3>
                  <p className="text-muted-foreground">Get started quickly with AI assistance</p>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">What type of ticket is this?</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {basicTicketTypes.map((type) => (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-all ${formData.type === type.value
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:shadow-md'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, type: type.value as any }));
                          }
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${type.color} text-white flex items-center justify-center`}>
                            {type.icon}
                          </div>
                          <div className="text-sm font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Show More Button */}
                  {!showAllTypes && (
                    <div className="mt-4 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllTypes(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Hiển thị thêm
                      </Button>
                    </div>
                  )}

                  {/* Educational Types (shown when expanded) */}
                  {showAllTypes && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Educational Types</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllTypes(false)}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Thu gọn
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {educationalTicketTypes.map((type) => (
                          <Card
                            key={type.value}
                            className={`cursor-pointer transition-all ${formData.type === type.value
                              ? 'ring-2 ring-primary border-primary'
                              : 'hover:shadow-md'
                              }`}
                            onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                          >
                            <CardContent className="p-4 text-center">
                              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${type.color} text-white flex items-center justify-center`}>
                                {type.icon}
                              </div>
                              <div className="text-sm font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Title with AI */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <AIAutoComplete
                    value={formData.title}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, title: value }));
                      // Clear validation error when user starts typing
                      if (validationErrors.title) {
                        setValidationErrors(prev => ({ ...prev, title: undefined }));
                      }
                    }}
                    placeholder="Brief, descriptive title for your issue or request"
                    type="title"
                    context={{
                      courseCode: formData.courseCode,
                      className: formData.className,
                      projectGroup: formData.projectGroup
                    }}
                  />
                  {validationErrors.title && (
                    <ValidationMessage
                      message={validationErrors.title}
                      type="error"
                    />
                  )}
                </div>

                {/* Description with Rich Text Editor */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Description *</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, description: value }));
                      // Clear validation error when user starts typing
                      if (validationErrors.description) {
                        setValidationErrors(prev => ({ ...prev, description: undefined }));
                      }
                    }}
                    placeholder="Detailed description of your issue, including steps to reproduce, expected vs actual behavior, etc."
                  />
                  {validationErrors.description && (
                    <ValidationMessage
                      message={validationErrors.description}
                      type="error"
                    />
                  )}
                </div>

                {/* Auto-Suggestion Panel */}
                {(() => {
                  const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim();
                  const questionText = `${formData.title} ${descriptionText}`.trim();
                  const shouldShowSuggestions = questionText.length > 50;

                  return shouldShowSuggestions ? (
                    <AutoSuggestionPanel
                      questionText={questionText}
                      courseCode={formData.courseCode}
                      onSuggestionApplied={(entryId) => {
                        console.log('Suggestion applied:', entryId);
                      }}
                    />
                  ) : null;
                })()}

                {/* Code Runner */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Code (Optional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add code snippets to help others understand the issue. You can run the code to see the output.
                  </p>
                  <CodeRunner
                    value={formData.code}
                    onChange={(value) => setFormData(prev => ({ ...prev, code: value }))}
                    placeholder="// Add your code here...\nconsole.log('Hello World');"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Priority</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {priorities.map((priority) => (
                      <Card
                        key={priority.value}
                        className={`cursor-pointer transition-all ${formData.priority === priority.value
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:shadow-md'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as any }))}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, priority: priority.value as any }));
                          }
                        }}
                      >
                        <CardContent className="p-3 text-center">
                          <Badge className={`w-full ${priority.color}`}>
                            {priority.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">{priority.description}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions */}
                {showSuggestions && aiSuggestions && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        AI Suggestions
                        {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {aiSuggestions.suggested_type && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Suggested Type:</span>
                            <Badge variant="outline">
                              {aiSuggestions.suggested_type}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setFormData(prev => ({ ...prev, type: aiSuggestions.suggested_type }))}
                            >
                              Apply
                            </Button>
                          </div>
                        )}
                        {aiSuggestions.suggested_priority && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Suggested Priority:</span>
                            <Badge className={priorities.find(p => p.value === aiSuggestions.suggested_priority)?.color}>
                              {aiSuggestions.suggested_priority}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setFormData(prev => ({ ...prev, priority: aiSuggestions.suggested_priority }))}
                            >
                              Apply
                            </Button>
                          </div>
                        )}
                        {aiSuggestions.analysis && (
                          <p className="text-sm text-muted-foreground">{aiSuggestions.analysis}</p>
                        )}
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => setShowSuggestions(false)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                {/* Template Selection */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Smart Templates</h3>
                  <p className="text-muted-foreground">Choose from AI-powered templates for common issues</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all border-2 border-dashed border-primary/20 hover:border-primary"
                    onClick={() => setShowTemplates(true)}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Browse Templates</CardTitle>
                      <CardDescription>
                        Choose from 12+ smart templates for common issues
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="space-y-2 mb-4">
                        <Badge variant="secondary">Bug Reports</Badge>
                        <Badge variant="secondary">Feature Requests</Badge>
                        <Badge variant="secondary">Questions</Badge>
                        <Badge variant="secondary">Setup Help</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:shadow-md transition-all border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground"
                    onClick={() => setActiveTab("detailed")}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Lightbulb className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">Custom Ticket</CardTitle>
                      <CardDescription>
                        Create a completely custom ticket from scratch
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button type="button" variant="outline" className="w-full">
                        <Target className="h-4 w-4 mr-2" />
                        Start Custom
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Selected Template Preview */}
                {formData.title && formData.description && (
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Template Applied
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="font-medium">{formData.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          <div dangerouslySetInnerHTML={{ __html: formData.description }} />
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{formData.type}</Badge>
                          <Badge className={priorities.find(p => p.value === formData.priority)?.color}>
                            {formData.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="detailed" className="space-y-6">
                {/* Detailed Form */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Detailed Ticket Creation</h3>
                  <p className="text-muted-foreground">Provide comprehensive information for better assistance</p>
                </div>

                {/* Educational Context */}
                <Card className="border-border bg-card/50 dark:bg-card/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Educational Context
                    </CardTitle>
                    <CardDescription>
                      Provide context about your course and class for better AI assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Course Code</label>
                        <Input
                          placeholder="e.g., PRJ301, SWP391"
                          value={formData.courseCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, courseCode: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Class Name</label>
                        <Input
                          placeholder="e.g., SE1730, SE1731"
                          value={formData.className}
                          onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Project Group</label>
                        <Input
                          placeholder="e.g., Team 07, Group A"
                          value={formData.projectGroup}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectGroup: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(newTag);
                          }
                        }}
                      />
                      <Button type="button" onClick={() => addTag(newTag)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Common tags: {commonTags.slice(0, 8).map(tag => (
                        <span
                          key={tag}
                          className="cursor-pointer hover:text-primary mr-2"
                          onClick={() => addTag(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Urgency Level</label>
                  <div className="space-y-2">
                    {urgencies.map((urgency) => (
                      <Card
                        key={urgency.value}
                        className={`cursor-pointer transition-all ${formData.urgency === urgency.value
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:shadow-md'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: urgency.value as any }))}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, urgency: urgency.value as any }));
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {urgency.icon}
                              <div>
                                <div className="font-medium">{urgency.label}</div>
                                <div className="text-sm text-muted-foreground">{urgency.description}</div>
                              </div>
                            </div>
                            {formData.urgency === urgency.value && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Attach Images</label>
                  <ImageUpload
                    maxImages={5}
                    maxSize={5}
                    images={formData.images}
                    onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                  />
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Estimated Resolution Time</label>
                  <Select
                    value={formData.estimatedTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select estimated time" />
                    </SelectTrigger>
                    <SelectContent>
                      {estimatedTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Ticket Preview
                  </h3>

                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {formData.title || "Your ticket title will appear here"}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground mb-3">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: formData.description || "Your ticket description will appear here"
                              }}
                            />
                          </div>

                          {/* Educational Context */}
                          {(formData.courseCode || formData.className || formData.projectGroup) && (
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              {formData.courseCode && (
                                <Badge variant="outline" className="text-xs">
                                  {formData.courseCode}
                                </Badge>
                              )}
                              {formData.className && (
                                <Badge variant="outline" className="text-xs">
                                  {formData.className}
                                </Badge>
                              )}
                              {formData.projectGroup && (
                                <Badge variant="outline" className="text-xs">
                                  {formData.projectGroup}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {formData.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={`${priorities.find(p => p.value === formData.priority)?.color}`}>
                            {formData.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formData.type}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formData.estimatedTime}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <div className="flex gap-3">
                {activeTab !== "preview" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("preview")}
                  >
                    Preview
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!formData.title.trim() || !formData.description.replace(/<[^>]*>/g, '').trim() || isCreating}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Templates Modal */}
      {showTemplates && (
        <EnhancedTicketTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

    </div>
  );
};
