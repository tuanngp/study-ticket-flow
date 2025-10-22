import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Settings, 
  Code, 
  FileText, 
  Star,
  BookOpen,
  Target,
  Upload,
  Users
} from 'lucide-react';

const EducationalTicketTypesTest = () => {
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

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Educational Ticket Types Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {educationalTicketTypes.map((type) => (
              <div
                key={type.value}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${type.color} text-white`}>
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{type.label}</h3>
                    <Badge variant="outline" className="text-xs">
                      {type.value}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Triage Test Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Grading Issue Example</h4>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Title:</strong> "My assignment grade seems incorrect"<br/>
                <strong>Description:</strong> "I submitted my Java project on time but got 0 points. Can you check what went wrong?"
              </p>
              <div className="flex gap-2">
                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Expected: grading</Badge>
                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Priority: high</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Assignment Help Example</h4>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Title:</strong> "Need help with React hooks implementation"<br/>
                <strong>Description:</strong> "I'm working on the PRJ301 assignment and can't figure out how to use useEffect properly."
              </p>
              <div className="flex gap-2">
                <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/20">Expected: assignment</Badge>
                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Priority: medium</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Technical Support Example</h4>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Title:</strong> "Can't connect to database in my project"<br/>
                <strong>Description:</strong> "Getting connection timeout errors when trying to connect to PostgreSQL from my Spring Boot application."
              </p>
              <div className="flex gap-2">
                <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Expected: technical</Badge>
                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Priority: high</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationalTicketTypesTest;
