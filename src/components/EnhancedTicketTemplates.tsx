import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from './RichTextEditor';
import { 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Settings, 
  Code, 
  Database, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Users,
  Zap,
  ArrowUpRight
} from "lucide-react";

interface TicketTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  priority: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  icon: React.ReactNode;
  color: string;
  content: {
    title: string;
    description: string;
    steps: string[];
    expectedOutcome: string;
    resources: string[];
  };
}

interface EnhancedTicketTemplatesProps {
  onSelectTemplate: (template: TicketTemplate) => void;
  onClose: () => void;
}

export const EnhancedTicketTemplates = ({ onSelectTemplate, onClose }: EnhancedTicketTemplatesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | null>(null);

  const templates: TicketTemplate[] = [
    // Bug Reports
    {
      id: "bug-compilation-error",
      title: "Code Compilation Error",
      description: "Template for Java compilation errors and build issues",
      category: "Bug",
      type: "bug",
      priority: "high",
      estimatedTime: "30-60 min",
      difficulty: "intermediate",
      tags: ["java", "compilation", "build"],
      icon: <Bug className="h-5 w-5" />,
      color: "bg-red-500",
      content: {
        title: "Compilation Error in [Project Name]",
        description: "I'm getting compilation errors when building my Java project. The error occurs when I try to compile the code and prevents the application from running. I need help understanding what's causing the issue and how to fix it.\n\n**Error Details:**\n- Error message: [Include the exact error message here]\n- File causing error: [Specify the file name and line number]\n- Java version: [Your Java version]\n- IDE: [Your IDE name and version]\n\n**Code causing the error:**\n```java\n[Include the problematic code here]\n```\n\n**Full stack trace:**\n[Include the complete stack trace if available]",
        steps: [
          "Describe the exact error message",
          "Include the code that's causing the error",
          "Mention your Java version and IDE",
          "Show the full stack trace if available"
        ],
        expectedOutcome: "Code compiles successfully without errors",
        resources: ["Java Documentation", "IDE Setup Guide", "Common Compilation Errors"]
      }
    },
    {
      id: "bug-runtime-error",
      title: "Runtime Exception",
      description: "Template for NullPointerException, ArrayIndexOutOfBounds, etc.",
      category: "Bug",
      type: "bug",
      priority: "high",
      estimatedTime: "45-90 min",
      difficulty: "intermediate",
      tags: ["java", "runtime", "exception"],
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "bg-red-500",
      content: {
        title: "Runtime Exception: [Exception Type]",
        description: "My application is crashing with a runtime exception. The program runs fine initially but crashes when I perform a specific action. I need help understanding why this exception occurs and how to fix it.\n\n**Exception Details:**\n- Exception type: [NullPointerException, ArrayIndexOutOfBoundsException, etc.]\n- When it occurs: [Describe the specific action that triggers the exception]\n- Frequency: [Always, sometimes, specific conditions]\n\n**Full stack trace:**\n```\n[Include the complete stack trace here]\n```\n\n**Problematic code section:**\n```java\n[Include the code that's causing the exception]\n```\n\n**Steps to reproduce:**\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n4. Exception occurs",
        steps: [
          "Describe when the exception occurs",
          "Include the full stack trace",
          "Show the problematic code section",
          "Describe steps to reproduce"
        ],
        expectedOutcome: "Application runs without exceptions",
        resources: ["Exception Handling Guide", "Debugging Techniques", "Java Best Practices"]
      }
    },
    {
      id: "bug-database-connection",
      title: "Database Connection Issue",
      description: "Template for database connectivity problems",
      category: "Bug",
      type: "bug",
      priority: "high",
      estimatedTime: "60-120 min",
      difficulty: "intermediate",
      tags: ["database", "connection", "sql"],
      icon: <Database className="h-5 w-5" />,
      color: "bg-red-500",
      content: {
        title: "Database Connection Failed",
        description: "I'm unable to connect to the database in my application. The connection was working before but now it's failing. I need help troubleshooting the connection issue.\n\n**Connection Details:**\n- Database type: [MySQL, PostgreSQL, SQLite, etc.]\n- Connection string: [Your connection string - hide sensitive info]\n- Error message: [Include the exact error message]\n- When it started failing: [When did this issue begin?]\n\n**Configuration:**\n```properties\n# Database configuration\ndb.url=[Your database URL]\ndb.username=[Your username]\ndb.password=[Hidden for security]\n```\n\n**Error details:**\n```\n[Include the full error message and stack trace]\n```\n\n**What I've tried:**\n- [List what you've already attempted]\n- [Any previous solutions that didn't work]",
        steps: [
          "Describe the connection error",
          "Include database configuration",
          "Check network connectivity",
          "Verify credentials and permissions"
        ],
        expectedOutcome: "Successfully connect to database",
        resources: ["Database Setup Guide", "Connection Troubleshooting", "SQL Configuration"]
      }
    },

    // Feature Requests
    {
      id: "feature-new-functionality",
      title: "New Feature Request",
      description: "Template for requesting new application features",
      category: "Feature",
      type: "feature",
      priority: "medium",
      estimatedTime: "2-4 hours",
      difficulty: "advanced",
      tags: ["feature", "enhancement", "new"],
      icon: <Lightbulb className="h-5 w-5" />,
      color: "bg-blue-500",
      content: {
        title: "Feature Request: [Feature Name]",
        description: "I would like to request a new feature for the application that would improve user experience and functionality. This feature would help users accomplish their tasks more efficiently.\n\n**Feature Description:**\n- Feature name: [Clear, descriptive name]\n- Current behavior: [How things work now]\n- Desired behavior: [How you want it to work]\n- User impact: [Who will benefit and how]\n\n**Use Cases:**\n1. [Primary use case - most common scenario]\n2. [Secondary use case - additional scenarios]\n3. [Edge cases - special situations]\n\n**Business Value:**\n- [Why this feature is important]\n- [How it improves the application]\n- [Expected user satisfaction increase]\n\n**Implementation Suggestions:**\n- [Your ideas on how to implement this]\n- [Any technical considerations]\n- [UI/UX mockups or examples if available]",
        steps: [
          "Describe the desired feature in detail",
          "Explain the business value and use cases",
          "Provide mockups or examples if possible",
          "Suggest implementation approach"
        ],
        expectedOutcome: "Feature implemented and working",
        resources: ["Feature Planning Guide", "UI/UX Best Practices", "Implementation Examples"]
      }
    },
    {
      id: "feature-ui-improvement",
      title: "UI/UX Improvement",
      description: "Template for user interface enhancements",
      category: "Feature",
      type: "feature",
      priority: "medium",
      estimatedTime: "1-3 hours",
      difficulty: "intermediate",
      tags: ["ui", "ux", "design", "improvement"],
      icon: <FileText className="h-5 w-5" />,
      color: "bg-blue-500",
      content: {
        title: "UI Improvement: [Component/Page Name]",
        description: "I've identified several UI/UX issues in the application that are affecting user experience. I would like to propose improvements to make the interface more intuitive and user-friendly.\n\n**Current Issues:**\n- [Describe the specific UI problems]\n- [How these issues affect users]\n- [Frequency of occurrence]\n\n**Proposed Improvements:**\n- [Specific changes you want to see]\n- [Why these changes would help]\n- [Expected user experience improvement]\n\n**Screenshots/Mockups:**\n- [Include current screenshots showing the issues]\n- [Include mockups or wireframes of proposed changes]\n- [Before/after comparisons if available]\n\n**User Impact:**\n- [How many users are affected]\n- [What tasks are made difficult]\n- [Expected improvement in user satisfaction]\n\n**Technical Considerations:**\n- [Any technical constraints or requirements]\n- [Compatibility with existing design system]\n- [Implementation complexity]",
        steps: [
          "Describe current UI issues",
          "Propose specific improvements",
          "Include screenshots or mockups",
          "Explain user impact"
        ],
        expectedOutcome: "Improved user interface and experience",
        resources: ["UI Design Guidelines", "Accessibility Standards", "User Testing Results"]
      }
    },

    // Questions
    {
      id: "question-concept-clarification",
      title: "Concept Clarification",
      description: "Template for asking about programming concepts",
      category: "Question",
      type: "question",
      priority: "low",
      estimatedTime: "15-30 min",
      difficulty: "beginner",
      tags: ["concept", "learning", "understanding"],
      icon: <HelpCircle className="h-5 w-5" />,
      color: "bg-green-500",
      content: {
        title: "Question: [Concept Name]",
        description: "I'm learning about [concept name] and I need help understanding it better. I have some basic knowledge but there are parts that are confusing me. I would appreciate clarification and examples to help me grasp the concept fully.\n\n**What I understand so far:**\n- [Your current understanding of the concept]\n- [What you've learned from tutorials/documentation]\n- [Any examples you've seen that make sense]\n\n**What's confusing me:**\n- [Specific parts that are unclear]\n- [Conflicting information you've found]\n- [Gaps in your understanding]\n\n**Specific questions:**\n1. [Your first question about the concept]\n2. [Your second question]\n3. [Any other questions]\n\n**Context:**\n- [Why you need to understand this concept]\n- [How you plan to use it]\n- [Any related concepts you're also learning]\n\n**What would help:**\n- [Types of examples that would be useful]\n- [Specific scenarios you'd like explained]\n- [Any resources you've already tried]",
        steps: [
          "State the concept you're asking about",
          "Explain what you understand so far",
          "Describe what's confusing you",
          "Ask specific questions"
        ],
        expectedOutcome: "Clear understanding of the concept",
        resources: ["Concept Documentation", "Tutorial Videos", "Practice Exercises"]
      }
    },
    {
      id: "question-best-practice",
      title: "Best Practice Question",
      description: "Template for asking about coding best practices",
      category: "Question",
      type: "question",
      priority: "low",
      estimatedTime: "20-40 min",
      difficulty: "intermediate",
      tags: ["best-practice", "code-quality", "standards"],
      icon: <Star className="h-5 w-5" />,
      color: "bg-green-500",
      content: {
        title: "Best Practice: [Topic]",
        description: "I'm working on [specific task/project] and I want to make sure I'm following best practices. I have a working solution but I'm not sure if it's the most efficient or maintainable approach. I would appreciate guidance on industry standards and better alternatives.\n\n**Current Approach:**\n- [Describe your current implementation]\n- [Why you chose this approach]\n- [What's working well]\n\n**Code Example:**\n```java\n[Include your current code here]\n```\n\n**Concerns/Questions:**\n- [What you're unsure about]\n- [Potential issues you've identified]\n- [Performance or maintainability concerns]\n\n**What I'm looking for:**\n- [Alternative approaches you'd like to know about]\n- [Industry standards for this type of problem]\n- [Code review suggestions]\n- [Best practices for this specific technology]\n\n**Context:**\n- [Project requirements or constraints]\n- [Team coding standards]\n- [Performance requirements]\n- [Maintenance considerations]",
        steps: [
          "Describe your current approach",
          "Ask about alternative methods",
          "Request code review suggestions",
          "Seek industry standards"
        ],
        expectedOutcome: "Improved code quality and standards",
        resources: ["Coding Standards", "Code Review Guidelines", "Industry Best Practices"]
      }
    },

    // Setup & Configuration
    {
      id: "setup-project-setup",
      title: "Project Setup Help",
      description: "Template for project initialization and setup issues",
      category: "Setup",
      type: "task",
      priority: "high",
      estimatedTime: "30-60 min",
      difficulty: "beginner",
      tags: ["setup", "configuration", "environment"],
      icon: <Settings className="h-5 w-5" />,
      color: "bg-purple-500",
      content: {
        title: "Project Setup Issue: [Project Type]",
        description: "I'm having trouble setting up my development environment for [project type]. I've followed the setup instructions but I'm encountering errors that prevent me from getting started. I need help troubleshooting the setup process.\n\n**Current Setup:**\n- Operating System: [Windows/Mac/Linux and version]\n- IDE: [Your IDE name and version]\n- Java version: [Your Java version]\n- Build tool: [Maven/Gradle and version]\n- Other tools: [Any other relevant software]\n\n**Error Messages:**\n```\n[Include the exact error messages you're seeing]\n```\n\n**What I've tried:**\n- [Steps you've already attempted]\n- [Solutions you've found online]\n- [Any workarounds that didn't work]\n\n**Setup Steps I Followed:**\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n4. [Where it failed]\n\n**What I need help with:**\n- [Specific issues you're facing]\n- [What you're trying to achieve]\n- [Any constraints or requirements]",
        steps: [
          "Describe your current setup",
          "List installed software and versions",
          "Include error messages or issues",
          "Specify your operating system"
        ],
        expectedOutcome: "Working development environment",
        resources: ["Setup Documentation", "Environment Guides", "Troubleshooting Tips"]
      }
    },
    {
      id: "setup-dependency-issue",
      title: "Dependency Management",
      description: "Template for Maven/Gradle dependency problems",
      category: "Setup",
      type: "task",
      priority: "medium",
      estimatedTime: "45-90 min",
      difficulty: "intermediate",
      tags: ["dependencies", "maven", "gradle", "libraries"],
      icon: <Code className="h-5 w-5" />,
      color: "bg-purple-500",
      content: {
        title: "Dependency Issue: [Library Name]",
        description: "I'm having trouble with project dependencies in my [Maven/Gradle] project. The dependencies are not resolving correctly or there are version conflicts. I need help understanding what's going wrong and how to fix it.\n\n**Project Details:**\n- Build tool: [Maven/Gradle and version]\n- Java version: [Your Java version]\n- IDE: [Your IDE name and version]\n\n**Dependencies I'm trying to use:**\n- [List the specific libraries and versions]\n- [Any parent POM or BOM you're using]\n- [Repository configurations]\n\n**Build File:**\n```xml\n<!-- Include your pom.xml or build.gradle here -->\n```\n\n**Error Messages:**\n```\n[Include the exact error messages]\n```\n\n**What I've tried:**\n- [Steps you've already attempted]\n- [Version changes you've made]\n- [Repository configurations you've tried]\n\n**Expected vs Actual:**\n- [What you expected to happen]\n- [What actually happened]\n- [Any workarounds that partially work]",
        steps: [
          "List the dependencies you're trying to use",
          "Include your build file (pom.xml/build.gradle)",
          "Describe the specific error",
          "Mention your build tool version"
        ],
        expectedOutcome: "Dependencies resolved and working",
        resources: ["Dependency Management Guide", "Build Tool Documentation", "Library Documentation"]
      }
    },

    // Academic Specific
    {
      id: "academic-assignment-help",
      title: "Assignment Help",
      description: "Template for academic assignment assistance",
      category: "Academic",
      type: "question",
      priority: "high",
      estimatedTime: "1-2 hours",
      difficulty: "intermediate",
      tags: ["assignment", "academic", "homework"],
      icon: <BookOpen className="h-5 w-5" />,
      color: "bg-orange-500",
      content: {
        title: "Assignment Help: [Assignment Name]",
        description: "I'm working on an academic assignment and I need guidance to understand the requirements and approach it correctly. I want to learn the concepts, not just get the solution. I would appreciate help understanding the problem and guidance on how to approach it.\n\n**Assignment Details:**\n- Course: [Course name and code]\n- Assignment: [Assignment name and number]\n- Due date: [When it's due]\n- Points: [How many points it's worth]\n\n**Requirements:**\n- [List the specific requirements]\n- [Any constraints or limitations]\n- [Expected deliverables]\n- [Submission format]\n\n**My Current Progress:**\n- [What you've completed so far]\n- [What you understand about the problem]\n- [Any code or work you've done]\n\n**Specific Challenges:**\n- [What you're struggling with]\n- [Concepts you don't understand]\n- [Technical issues you're facing]\n- [Where you're stuck]\n\n**What I need help with:**\n- [Specific guidance you're looking for]\n- [Concepts you want to understand better]\n- [Approach suggestions]\n- [Resources that might help]",
        steps: [
          "Describe the assignment requirements",
          "Show your current progress",
          "Explain specific challenges",
          "Ask for guidance, not solutions"
        ],
        expectedOutcome: "Completed assignment with understanding",
        resources: ["Assignment Guidelines", "Course Materials", "Academic Resources"]
      }
    },
    {
      id: "academic-grading-inquiry",
      title: "Grading Inquiry",
      description: "Template for questions about grades and feedback",
      category: "Academic",
      type: "question",
      priority: "medium",
      estimatedTime: "15-30 min",
      difficulty: "beginner",
      tags: ["grading", "feedback", "academic"],
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-orange-500",
      content: {
        title: "Grading Inquiry: [Assignment/Exam Name]",
        description: "I received feedback on my [assignment/exam] and I would like to understand the grading better. I want to learn from the feedback and improve for future assignments. I have some questions about the grade and would appreciate clarification.\n\n**Assignment/Exam Details:**\n- Course: [Course name and code]\n- Assignment: [Assignment name and number]\n- Grade received: [Your grade]\n- Date graded: [When you received the grade]\n\n**Feedback Received:**\n- [Include the specific feedback you received]\n- [Any comments from the instructor]\n- [Areas marked for improvement]\n\n**My Understanding:**\n- [What you understand about the feedback]\n- [What you think you did well]\n- [What you think needs improvement]\n\n**Specific Questions:**\n1. [Your first question about the grade]\n2. [Your second question]\n3. [Any other questions]\n\n**What I'd like to clarify:**\n- [Specific aspects you want to understand better]\n- [Any confusion about the feedback]\n- [How to improve for next time]\n\n**Context:**\n- [Why this grade matters to you]\n- [Any concerns about your progress]\n- [Goals for improvement]",
        steps: [
          "Specify the assignment or exam",
          "Describe your understanding of the feedback",
          "Ask specific questions about the grade",
          "Request clarification if needed"
        ],
        expectedOutcome: "Clear understanding of grade and feedback",
        resources: ["Grading Rubric", "Feedback Guidelines", "Academic Policies"]
      }
    }
  ];

  const categories = [
    { value: "all", label: "All Categories", icon: <Filter className="h-4 w-4" /> },
    { value: "Bug", label: "Bug Reports", icon: <Bug className="h-4 w-4" /> },
    { value: "Feature", label: "Features", icon: <Lightbulb className="h-4 w-4" /> },
    { value: "Question", label: "Questions", icon: <HelpCircle className="h-4 w-4" /> },
    { value: "Setup", label: "Setup & Config", icon: <Settings className="h-4 w-4" /> },
    { value: "Academic", label: "Academic", icon: <BookOpen className="h-4 w-4" /> }
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Smart Ticket Templates
          </DialogTitle>
          <DialogDescription>
            Choose from our AI-powered templates to create tickets faster and more effectively
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg mb-4 flex-shrink-0">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      {category.icon}
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {/* Scroll indicator */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-muted/20 to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none z-10" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1">
              {/* Scroll hint */}
              {filteredTemplates.length > 6 && (
                <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="ml-2">Scroll to see more templates</span>
                  </div>
                </div>
              )}
              
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Try adjusting your search terms or filters to find the perfect template for your ticket.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setSelectedDifficulty('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button onClick={onClose}>
                      Create Custom Ticket
                    </Button>
                  </div>
                </div>
              ) : (
                filteredTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-l-4 hover:border-l-primary hover:-translate-y-1 bg-gradient-to-br from-card to-card/50"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${template.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {template.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1 text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                        {template.category}
                      </Badge>
                      <Badge className={`text-xs font-medium px-2 py-1 ${getPriorityColor(template.priority)}`}>
                        {template.priority}
                      </Badge>
                      <Badge className={`text-xs font-medium px-2 py-1 ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{template.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium capitalize">{template.type}</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {template.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted transition-colors">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/50">
                          +{template.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => onSelectTemplate(template)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="px-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Template Preview Dialog */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
              <DialogHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${selectedTemplate.color} text-white shadow-lg`}>
                    {selectedTemplate.icon}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold mb-2">
                      {selectedTemplate.title}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                      {selectedTemplate.description}
                    </DialogDescription>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="outline" className="px-3 py-1">
                        {selectedTemplate.category}
                      </Badge>
                      <Badge className={`px-3 py-1 ${getPriorityColor(selectedTemplate.priority)}`}>
                        {selectedTemplate.priority}
                      </Badge>
                      <Badge className={`px-3 py-1 ${getDifficultyColor(selectedTemplate.difficulty)}`}>
                        {selectedTemplate.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="px-3 py-1">
                        {selectedTemplate.estimatedTime}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Template Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Category</div>
                            <div className="font-medium">{selectedTemplate.category}</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Priority</div>
                            <div className="font-medium">{selectedTemplate.priority}</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Difficulty</div>
                            <div className="font-medium">{selectedTemplate.difficulty}</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Est. Time</div>
                            <div className="font-medium">{selectedTemplate.estimatedTime}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-6">
                    <div className="space-y-6">
                      {/* Title Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <h4 className="font-semibold text-lg">Title</h4>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border/50">
                          <div className="font-medium text-foreground">
                            {selectedTemplate.content.title}
                          </div>
                        </div>
                      </div>
                      
                      {/* Description Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h4 className="font-semibold text-lg">Description</h4>
                        </div>
                        <div className="border rounded-xl bg-background p-4">
                          <div className="text-sm leading-relaxed space-y-3">
                            {selectedTemplate.content.description.split('\n\n').map((paragraph, index) => {
                              // Handle markdown formatting
                              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                                return (
                                  <div key={index} className="font-semibold text-foreground">
                                    {paragraph.replace(/\*\*/g, '')}
                                  </div>
                                );
                              }
                              
                              if (paragraph.includes('```')) {
                                const parts = paragraph.split('```');
                                return (
                                  <div key={index} className="space-y-2">
                                    {parts.map((part, partIndex) => {
                                      if (partIndex % 2 === 1) {
                                        // Code block
                                        return (
                                          <div key={partIndex} className="bg-muted/50 p-3 rounded-lg font-mono text-xs border">
                                            <pre className="whitespace-pre-wrap">{part.trim()}</pre>
                                          </div>
                                        );
                                      } else {
                                        // Regular text
                                        return (
                                          <div key={partIndex} className="text-foreground">
                                            {part.split('\n').map((line, lineIndex) => (
                                              <div key={lineIndex}>
                                                {line.startsWith('- ') ? (
                                                  <div className="flex items-start gap-2">
                                                    <span className="text-muted-foreground mt-1">•</span>
                                                    <span>{line.substring(2)}</span>
                                                  </div>
                                                ) : (
                                                  line
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                );
                              }
                              
                              return (
                                <div key={index} className="text-foreground">
                                  {paragraph.split('\n').map((line, lineIndex) => (
                                    <div key={lineIndex}>
                                      {line.startsWith('- ') ? (
                                        <div className="flex items-start gap-2">
                                          <span className="text-muted-foreground mt-1">•</span>
                                          <span>{line.substring(2)}</span>
                                        </div>
                                      ) : (
                                        line
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Steps Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <h4 className="font-semibold text-lg">Steps to Include</h4>
                        </div>
                        <div className="space-y-3">
                          {selectedTemplate.content.steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl border border-border/30 hover:border-border/50 transition-colors">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                {index + 1}
                              </div>
                              <div className="flex-1 text-sm leading-relaxed text-foreground">
                                {step}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Expected Outcome Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <h4 className="font-semibold text-lg">Expected Outcome</h4>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                              {selectedTemplate.content.expectedOutcome}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="resources" className="space-y-6">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <h4 className="font-semibold text-lg">Helpful Resources</h4>
                        </div>
                        <div className="grid gap-3">
                          {selectedTemplate.content.resources.map((resource, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl border border-border/30 hover:border-border/50 transition-all duration-200 hover:shadow-sm">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-md">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-foreground">
                                  {resource}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Click to access resource
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ArrowUpRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    onSelectTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
