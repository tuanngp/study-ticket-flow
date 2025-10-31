import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartAvatar } from '@/components/SmartAvatar';
import { useAuth } from '@/hooks/useAuth';
import { GroupGradeService, GroupService, type GroupGradeWithDetails, type GroupMemberWithDetails, type GradeType } from '@/services/groupService';
import { toast } from 'sonner';
import { 
  Award, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Users, 
  Star,
  Target,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GroupGradesProps {
  groupId: string;
  groupName: string;
  courseCode: string;
}

export const GroupGrades = ({ groupId, groupName, courseCode }: GroupGradesProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateGradeOpen, setIsCreateGradeOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<GradeType | 'all'>('all');

  // Fetch group grades
  const { data: grades, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['group-grades', groupId],
    queryFn: () => GroupGradeService.getGroupGrades(groupId),
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => GroupService.getGroupMembers(groupId),
    enabled: !!groupId,
  });

  // Fetch group details for permissions
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => GroupService.getGroupById(groupId),
    enabled: !!groupId,
  });

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: ({ userId, gradeData }: { userId: string; gradeData: any }) =>
      GroupGradeService.createGroupGrade(groupId, userId, gradeData, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-grades'] });
      setIsCreateGradeOpen(false);
      toast.success('Grade recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record grade');
    },
  });

  const canGradeStudents = group && (
    group.createdBy === user?.id || 
    group.instructorId === user?.id ||
    profile?.role === 'admin' ||
    profile?.role === 'instructor'
  );

  const filteredGrades = grades?.filter(grade => 
    gradeFilter === 'all' || grade.gradeType === gradeFilter
  ) || [];

  const studentGrades = members?.map(member => {
    const studentGradeList = grades?.filter(grade => grade.userId === member.userId) || [];
    const averageGrade = studentGradeList.length > 0 
      ? studentGradeList.reduce((sum, grade) => sum + parseFloat(grade.score), 0) / studentGradeList.length
      : 0;
    
    return {
      member,
      grades: studentGradeList,
      averageGrade,
      totalGrades: studentGradeList.length,
    };
  }) || [];

  const getGradeTypeIcon = (gradeType: string) => {
    switch (gradeType) {
      case 'assignment':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'quiz':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'group_project':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'individual_contribution':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'peer_review':
        return <Award className="h-4 w-4 text-orange-500" />;
      case 'attendance':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'participation':
        return <TrendingUp className="h-4 w-4 text-indigo-500" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGradeTypeColor = (gradeType: string) => {
    switch (gradeType) {
      case 'assignment':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'quiz':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'group_project':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'individual_contribution':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'peer_review':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'attendance':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'participation':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeProgress = (score: number, maxScore: number) => {
    return (score / maxScore) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Group Grades & Assessment
            </CardTitle>
            <CardDescription>
              Track and manage grades for {groupName} ({courseCode})
            </CardDescription>
          </div>
          
          {canGradeStudents && (
            <Dialog open={isCreateGradeOpen} onOpenChange={setIsCreateGradeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Grade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Grade</DialogTitle>
                  <DialogDescription>
                    Record a grade for a group member.
                  </DialogDescription>
                </DialogHeader>
                <CreateGradeForm 
                  members={members || []}
                  onSubmit={(data) => createGradeMutation.mutate(data)}
                  isLoading={createGradeMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="grades">All Grades</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Grade Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Grades</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">{grades?.length || 0}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Students Graded</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {new Set(grades?.map(g => g.userId) || []).size}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Average Grade</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {grades && grades.length > 0 
                      ? (grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0) / grades.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Distribution of grades by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : grades && grades.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(
                      grades.reduce((acc, grade) => {
                        acc[grade.gradeType] = (acc[grade.gradeType] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([gradeType, count]) => (
                      <div key={gradeType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getGradeTypeIcon(gradeType)}
                          <span className="text-sm font-medium">
                            {gradeType.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No grades recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="space-y-4">
              {isLoadingMembers ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : studentGrades.length > 0 ? (
                studentGrades.map(({ member, grades, averageGrade, totalGrades }) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SmartAvatar
                            name={member.user.fullName || member.user.email}
                            avatarUrl={member.user.avatarUrl}
                            size="md"
                          />
                          <div>
                            <p className="font-medium">{member.user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Average Grade</p>
                            <p className={`text-xl font-bold ${getGradeColor(averageGrade, 100)}`}>
                              {averageGrade.toFixed(1)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Grades</p>
                            <p className="text-xl font-bold">{totalGrades}</p>
                          </div>
                          
                          <div className="w-32">
                            <Progress value={averageGrade} className="h-2" />
                          </div>
                        </div>
                      </div>
                      
                      {grades.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex flex-wrap gap-2">
                            {grades.slice(0, 5).map(grade => (
                              <Badge key={grade.id} className={getGradeTypeColor(grade.gradeType)}>
                                {getGradeTypeIcon(grade.gradeType)}
                                <span className="ml-1">
                                  {grade.score}/{grade.maxScore}
                                </span>
                              </Badge>
                            ))}
                            {grades.length > 5 && (
                              <Badge variant="outline">
                                +{grades.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No students found</p>
              )}
            </div>
          </TabsContent>

          {/* All Grades Tab */}
          <TabsContent value="grades" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Grades</h3>
              <Select value={gradeFilter} onValueChange={(value: any) => setGradeFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">All Types</SelectItem>
                  <SelectItem key="assignment" value="assignment">Assignment</SelectItem>
                  <SelectItem key="quiz" value="quiz">Quiz</SelectItem>
                  <SelectItem key="group_project" value="group_project">Group Project</SelectItem>
                  <SelectItem key="individual_contribution" value="individual_contribution">Individual Contribution</SelectItem>
                  <SelectItem key="peer_review" value="peer_review">Peer Review</SelectItem>
                  <SelectItem key="attendance" value="attendance">Attendance</SelectItem>
                  <SelectItem key="participation" value="participation">Participation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              {isLoadingGrades ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : filteredGrades.length > 0 ? (
                filteredGrades.map(grade => (
                  <Card key={grade.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getGradeTypeIcon(grade.gradeType)}
                          <div>
                            <p className="font-medium">{grade.user.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {grade.gradeType.replace('_', ' ')} • {formatDistanceToNow(new Date(grade.gradedAt))} ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-xl font-bold ${getGradeColor(parseFloat(grade.score), parseFloat(grade.maxScore))}`}>
                              {grade.score}/{grade.maxScore}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getGradeProgress(parseFloat(grade.score), parseFloat(grade.maxScore)).toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="w-24">
                            <Progress 
                              value={getGradeProgress(parseFloat(grade.score), parseFloat(grade.maxScore))} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      {grade.feedback && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>Feedback:</strong> {grade.feedback}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No grades found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface CreateGradeFormProps {
  members: GroupMemberWithDetails[];
  onSubmit: (data: { userId: string; gradeData: any }) => void;
  isLoading: boolean;
}

const CreateGradeForm = ({ members, onSubmit, isLoading }: CreateGradeFormProps) => {
  const [formData, setFormData] = useState({
    userId: '',
    gradeType: 'assignment' as GradeType,
    score: '',
    maxScore: '100',
    feedback: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId: formData.userId,
      gradeData: {
        gradeType: formData.gradeType,
        score: formData.score,
        maxScore: formData.maxScore,
        feedback: formData.feedback,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">Student</Label>
        <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member, index) => {
              const displayName = `${member.user.fullName} (${member.user.email})`;
              return (
                <SelectItem 
                  key={member.id || `member-${member.userId}-${index}`} 
                  value={member.userId}
                >
                  {displayName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradeType">Grade Type</Label>
        <Select value={formData.gradeType} onValueChange={(value) => setFormData({ ...formData, gradeType: value as GradeType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="assignment" value="assignment">Assignment</SelectItem>
            <SelectItem key="quiz" value="quiz">Quiz</SelectItem>
            <SelectItem key="group_project" value="group_project">Group Project</SelectItem>
            <SelectItem key="individual_contribution" value="individual_contribution">Individual Contribution</SelectItem>
            <SelectItem key="peer_review" value="peer_review">Peer Review</SelectItem>
            <SelectItem key="attendance" value="attendance">Attendance</SelectItem>
            <SelectItem key="participation" value="participation">Participation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="score">Score</Label>
          <Input
            id="score"
            type="number"
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
            placeholder="e.g., 85"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxScore">Max Score</Label>
          <Input
            id="maxScore"
            type="number"
            value={formData.maxScore}
            onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
            placeholder="e.g., 100"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback">Feedback (Optional)</Label>
        <Textarea
          id="feedback"
          value={formData.feedback}
          onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
          placeholder="Provide feedback for the student"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Recording...' : 'Record Grade'}
        </Button>
      </div>
    </form>
  );
};
