import { SmartAvatar } from '@/components/SmartAvatar';
import { UserHomeSidebar } from '@/components/UserHomeSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { AuthService } from '@/services/authService';
import { GroupService, type CreateGroupData, type GroupWithDetails } from '@/services/groupService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar,
  Crown,
  LogIn,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  User,
  UserCheck,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const GroupsPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { canCreateGroups, canJoinGroups, canManageGroups } = usePermissions();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch user's groups (groups they belong to or created)
  const { data: userGroups, isLoading: isLoadingUserGroups } = useQuery({
    queryKey: ['user-groups', user?.id],
    queryFn: () => GroupService.getUserGroups(user!.id),
    enabled: !!user?.id,
  });

  // Fetch public groups (for all students to discover)
  const { data: publicGroups, isLoading: isLoadingPublicGroups } = useQuery({
    queryKey: ['public-groups'],
    queryFn: () => GroupService.getPublicGroups(),
  });

  // Combine user groups and public groups, removing duplicates
  const allGroups = React.useMemo(() => {
    if (!userGroups && !publicGroups) return [];
    
    const userGroupIds = new Set(userGroups?.map(g => g.id) || []);
    const publicGroupsFiltered = publicGroups?.filter(g => !userGroupIds.has(g.id)) || [];
    
    return [
      ...(userGroups || []),
      ...publicGroupsFiltered
    ];
  }, [userGroups, publicGroups]);

  const isLoadingGroups = isLoadingUserGroups || isLoadingPublicGroups;

  // Fetch available courses for filtering
  const { data: availableCourses } = useQuery({
    queryKey: ['available-courses'],
    queryFn: async () => {
      // This would typically come from a course service
      return [
        { code: 'PRJ301', name: 'Java Web Application Development' },
        { code: 'SWP391', name: 'Software Engineering Project' },
        { code: 'PRF192', name: 'Programming Fundamentals' },
        { code: 'MAS291', name: 'Mathematics for Software Engineering' },
      ];
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupData) => GroupService.createGroup(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['public-groups'] });
      setIsCreateDialogOpen(false);
      toast.success('Tạo nhóm thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tạo nhóm');
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => GroupService.joinGroup(groupId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['public-groups'] });
      toast.success('Tham gia nhóm thành công!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể tham gia nhóm');
    },
  });

  // Filter groups
  const filteredGroups = allGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !filterCourse || filterCourse === 'all' || group.courseCode === filterCourse;
    const matchesSemester = !filterSemester || filterSemester === 'all' || group.semester === filterSemester;

    return matchesSearch && matchesCourse && matchesSemester;
  });

  const handleCreateGroup = (data: CreateGroupData) => {
    createGroupMutation.mutate(data);
  };

  const handleJoinGroup = (groupId: string) => {
    joinGroupMutation.mutate(groupId);
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'instructor':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'class_leader':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'group_leader':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'instructor':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'class_leader':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'group_leader':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoadingGroups) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <UserHomeSidebar user={user} profile={profile} isMobile={false} />
        <SidebarInset className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="w-full p-6 space-y-6 flex flex-col overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nhóm</h1>
            <p className="text-muted-foreground">
              Cộng tác với bạn học và quản lý hoạt động nhóm
            </p>
          </div>

          {canCreateGroups && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo Nhóm
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tạo Nhóm Mới</DialogTitle>
                  <DialogDescription>
                    Tạo nhóm học tập mới cho môn học của bạn.
                  </DialogDescription>
                </DialogHeader>
                <CreateGroupForm onSubmit={handleCreateGroup} isLoading={createGroupMutation.isPending} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm nhóm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Lọc theo môn học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả môn học</SelectItem>
              {availableCourses?.map((course) => (
                <SelectItem key={course.code} value={course.code}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Lọc theo học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả học kỳ</SelectItem>
              <SelectItem value="2024A">2024A</SelectItem>
              <SelectItem value="2024B">2024B</SelectItem>
              <SelectItem value="2025A">2025A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Groups Grid */}
        <div className="flex-1 min-h-[500px]">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy nhóm</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || (filterCourse && filterCourse !== 'all') || (filterSemester && filterSemester !== 'all')
                  ? 'Thử điều chỉnh bộ lọc tìm kiếm'
                  : 'Tạo nhóm đầu tiên hoặc tham gia nhóm có sẵn'}
              </p>
              {canCreateGroups && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo Nhóm
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                // Check if user is already a member of this group
                const isMember = userGroups?.some(g => g.id === group.id) || false;
                
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    userRole={profile?.role}
                    userId={user?.id}
                    isMember={isMember}
                    onGroupClick={handleGroupClick}
                    onJoinGroup={handleJoinGroup}
                    canJoin={canJoinGroups}
                    canManage={canManageGroups}
                    getRoleIcon={getRoleIcon}
                    getRoleColor={getRoleColor}
                  />
                );
              })}
            </div>
          )}
        </div>

          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

interface GroupCardProps {
  group: GroupWithDetails;
  userRole?: string;
  userId?: string;
  isMember: boolean;
  onGroupClick: (groupId: string) => void;
  onJoinGroup: (groupId: string) => void;
  canJoin: boolean;
  canManage: boolean;
  getRoleIcon: (role: string) => React.ReactNode;
  getRoleColor: (role: string) => string;
}

const GroupCard = ({
  group,
  userRole,
  userId,
  isMember,
  onGroupClick,
  onJoinGroup,
  canJoin,
  canManage,
  getRoleIcon,
  getRoleColor
}: GroupCardProps) => {
  const handleCardClick = () => {
    onGroupClick(group.id);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoinGroup(group.id);
  };

  const handleEnterClassClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGroupClick(group.id);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {group.description || 'Không có mô tả'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {group.courseCode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {group.semester}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Group Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group.memberCount || 0}/{group.maxMembers || 100}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {group.createdAt
                  ? formatDistanceToNow(new Date(group.createdAt), { addSuffix: true, locale: vi })
                  : 'Vừa tạo'
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {group.isPublic ? (
              <Badge variant="outline" className="text-xs">Công khai</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Riêng tư</Badge>
            )}
          </div>
        </div>

        {/* Instructor/Leader */}
        {group.instructor && (
          <div className="flex items-center gap-2">
            <SmartAvatar
              name={group.instructor.fullName || group.instructor.email}
              avatarUrl={group.instructor.avatarUrl || undefined}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {group.instructor.fullName || group.instructor.email}
              </p>
              <p className="text-xs text-muted-foreground">Giảng viên</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-end justify-between pt-2">
          <div className="flex items-center gap-2">
            {canManage && (
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-end">
            {canJoin && !isMember && (
              <Button size="sm" onClick={handleJoinClick} variant="default" className="h-9 flex items-center justify-center">
                Tham gia
              </Button>
            )}

            {isMember && (
              <Button size="sm" onClick={handleEnterClassClick} variant="default" className="h-9 flex items-center justify-center">
                <LogIn className="h-4 w-4 mr-2" />
                Vào lớp
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CreateGroupFormProps {
  onSubmit: (data: CreateGroupData) => void;
  isLoading: boolean;
}

const CreateGroupForm = ({ onSubmit, isLoading }: CreateGroupFormProps) => {
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    courseCode: '',
    className: '',
    semester: '',
    maxMembers: 50,
    isPublic: true,
    allowSelfJoin: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên nhóm</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nhập tên nhóm"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả mục đích của nhóm này"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="courseCode">Mã môn học</Label>
          <Input
            id="courseCode"
            value={formData.courseCode}
            onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
            placeholder="VD: PRJ301"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Học kỳ</Label>
          <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024A">2024A</SelectItem>
              <SelectItem value="2024B">2024B</SelectItem>
              <SelectItem value="2025A">2025A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="className">Tên lớp (Tùy chọn)</Label>
        <Input
          id="className"
          value={formData.className}
          onChange={(e) => setFormData({ ...formData, className: e.target.value })}
          placeholder="VD: SE1730"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxMembers">Số thành viên tối đa</Label>
        <Input
          id="maxMembers"
          type="number"
          min="2"
          max="100"
          value={formData.maxMembers}
          onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isPublic">Nhóm công khai (hiển thị với tất cả sinh viên)</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="allowSelfJoin"
          checked={formData.allowSelfJoin}
          onChange={(e) => setFormData({ ...formData, allowSelfJoin: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="allowSelfJoin">Cho phép sinh viên tham gia mà không cần lời mời</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline">
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Đang tạo...' : 'Tạo Nhóm'}
        </Button>
      </div>
    </form>
  );
};
