import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Sparkles, 
  Check, 
  X, 
  Loader2,
  Lightbulb,
  Code,
  Bug,
  HelpCircle,
  BookOpen
} from "lucide-react";

interface AICompletion {
  id: string;
  type: 'title' | 'description' | 'suggestion';
  content: string;
  confidence: number;
  reasoning: string;
  category: 'coding' | 'academic' | 'system' | 'general';
}

interface AIAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type: 'title' | 'description';
  context?: {
    courseCode?: string;
    className?: string;
    projectGroup?: string;
  };
  onAcceptSuggestion?: (suggestion: string) => void;
}

export const AIAutoComplete = ({
  value,
  onChange,
  placeholder,
  type,
  context,
  onAcceptSuggestion
}: AIAutoCompleteProps) => {
  const [suggestions, setSuggestions] = useState<AICompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced AI suggestions
  const getAISuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate AI API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSuggestions: AICompletion[] = generateMockSuggestions(input, type, context);
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('AI suggestions failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, context]);

  // Generate mock suggestions based on input
  const generateMockSuggestions = (input: string, fieldType: string, ctx?: any): AICompletion[] => {
    const suggestions: AICompletion[] = [];
    const lowerInput = input.toLowerCase();

    // Title suggestions
    if (fieldType === 'title') {
      if (lowerInput.includes('error') || lowerInput.includes('bug')) {
        suggestions.push({
          id: '1',
          type: 'title',
          content: 'Fix compilation error in Java project',
          confidence: 0.9,
          reasoning: 'Detected error-related keywords',
          category: 'coding'
        });
      }
      
      if (lowerInput.includes('database') || lowerInput.includes('connection')) {
        suggestions.push({
          id: '2',
          type: 'title',
          content: 'Database connection issue - MySQL',
          confidence: 0.85,
          reasoning: 'Database-related keywords detected',
          category: 'system'
        });
      }

      if (lowerInput.includes('help') || lowerInput.includes('how')) {
        suggestions.push({
          id: '3',
          type: 'title',
          content: 'Need help with project setup',
          confidence: 0.8,
          reasoning: 'Help request detected',
          category: 'academic'
        });
      }
    }

    // Description suggestions
    if (fieldType === 'description') {
      if (lowerInput.includes('java') || lowerInput.includes('compilation')) {
        suggestions.push({
          id: '4',
          type: 'description',
          content: `**Error Message:**
[Paste the exact error message here]

**Code Location:**
- File: [filename.java]
- Line: [line number]

**What I was trying to do:**
[Describe what you were trying to accomplish]

**Environment:**
- Java Version: [e.g., Java 17]
- IDE: [e.g., IntelliJ IDEA]

**Steps to reproduce:**
1. [Step 1]
2. [Step 2]`,
          confidence: 0.9,
          reasoning: 'Java compilation error template',
          category: 'coding'
        });
      }

      if (lowerInput.includes('database') || lowerInput.includes('sql')) {
        suggestions.push({
          id: '5',
          type: 'description',
          content: `**Connection Details:**
- Database: [MySQL/PostgreSQL]
- Host: [hostname]
- Port: [port]

**Error Message:**
[Paste the exact error message]

**Environment:**
- OS: [Windows/Mac/Linux]
- Database Driver: [e.g., mysql-connector-java]

**Troubleshooting Steps:**
- [ ] Checked database server status
- [ ] Verified connection credentials`,
          confidence: 0.85,
          reasoning: 'Database connection template',
          category: 'system'
        });
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for AI suggestions (only if input is long enough)
    if (newValue.length >= 3) {
      debounceRef.current = setTimeout(() => {
        getAISuggestions(newValue);
      }, 1000);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AICompletion) => {
    onChange(suggestion.content);
    setShowSuggestions(false);
    onAcceptSuggestion?.(suggestion.content);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coding': return <Code className="h-4 w-4" />;
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'system': return <Bug className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coding': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'academic': return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'system': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="relative">
      {/* Input Field */}
      <div className="relative">
        {type === 'title' ? (
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={8}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
          />
        )}

        {/* AI Loading Indicator */}
        {isLoading && (
          <div className="absolute right-3 top-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* AI Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            <div className="p-2 border-b bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-primary" />
                AI Suggestions
                <Badge variant="secondary" className="text-xs">
                  {suggestions.length} suggestions
                </Badge>
              </div>
            </div>
            
            <div className="divide-y">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(suggestion.category)}>
                          {getCategoryIcon(suggestion.category)}
                          <span className="ml-1 capitalize">{suggestion.category}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="text-sm">
                        {type === 'title' ? (
                          <p className="font-medium">{suggestion.content}</p>
                        ) : (
                          <div className="max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-xs font-mono">
                              {suggestion.content}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 {suggestion.reasoning}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSuggestionSelect(suggestion);
                        }}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSuggestions(false);
                        }}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-2 border-t bg-muted/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Powered by AI</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
