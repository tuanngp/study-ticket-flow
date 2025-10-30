import { GroupAIAssistant } from '@/components/GroupAIAssistant';
import { GroupCalendar } from '@/components/GroupCalendar';
import { GroupGrades } from '@/components/GroupGrades';
import { GroupTicketCard } from '@/components/GroupTicketCard';
import { Pagination } from '@/components/Pagination';
import { SmartAvatar } from '@/components/SmartAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedTicketCreation } from '@/components/UnifiedTicketCreation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import {
  GroupChatService,
  GroupEventService,
  GroupGradeService,
  GroupService,
  GroupTicketService,
  type GradeType,
  type GroupEventType,
  type GroupMemberWithDetails,
  type GroupTicketType
} from '@/services/groupService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Copy,
  Crown,
  Download,
  Eye,
  FileText,
  Link,
  Lock,
  MoreHorizontal,
  Plus,
  Send,
  Settings,
  Share2,
  Shield,
  Ticket,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export const GroupDetailPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { canManageGroups, canGradeStudents, canManageGroupMembers } = usePermissions();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCreateGradeOpen, setIsCreateGradeOpen] = useState(false);
  const [isManageGroupOpen, setIsManageGroupOpen] = useState(false);
  const [manageGroupTab, setManageGroupTab] = useState('settings');
  const [groupSettings, setGroupSettings] = useState({
    name: '',
    description: '',
    maxMembers: 100,
    isPublic: true,
    allowSelfJoin: true
  });

  // Ticket filtering and pagination state
  const [ticketFilters, setTicketFilters] = useState({
    status: undefined as string | undefined,
    priority: undefined as string | undefined,
    type: undefined as string | undefined,
  });
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [showCreateTicketForm, setShowCreateTicketForm] = useState(false);
  const [ticketCurrentPage, setTicketCurrentPage] = useState(1);
  const [ticketPageSize, setTicketPageSize] = useState(12);
  const [newMessage, setNewMessage] = useState('');

  // Fetch group details
  const { data: group, isLoading: isLoadingGroup, error: groupError } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => GroupService.getGroupById(groupId!),
    enabled: !!groupId,
  });

  // Check if user is a member of the group
  const { data: userMembership } = useQuery({
    queryKey: ['group-membership', groupId, user?.id],
    queryFn: () => GroupService.checkUserMembership(groupId!, user!.id),
    enabled: !!groupId && !!user?.id,
  });

  // Reset pagination when filters change
  useEffect(() => {
    setTicketCurrentPage(1);
  }, [ticketFilters, ticketSearchQuery]);

  // Initialize group settings when group data is loaded
  useEffect(() => {
    if (group) {
      setGroupSettings({
        name: group.name || '',
        description: group.description || '',
        maxMembers: group.maxMembers || 100,
        isPublic: group.isPublic ?? true,
        allowSelfJoin: group.allowSelfJoin ?? true
      });
    }
  }, [group]);

  // Fetch group members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => GroupService.getGroupMembers(groupId!),
    enabled: !!groupId,
  });

  // Fetch group tickets with filtering and pagination
  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['group-tickets', groupId, ticketFilters, ticketCurrentPage, ticketPageSize, ticketSearchQuery],
    queryFn: async () => {
      if (!groupId) return { tickets: [], totalCount: 0, totalPages: 0 };

      const tickets = await GroupTicketService.getGroupTickets(groupId);

      // Apply filters
      let filteredTickets = tickets;
      if (ticketFilters.status && ticketFilters.status !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.ticket.status === ticketFilters.status);
      }
      if (ticketFilters.priority && ticketFilters.priority !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.ticket.priority === ticketFilters.priority);
      }
      if (ticketFilters.type && ticketFilters.type !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.ticketType === ticketFilters.type);
      }

      // Apply search
      if (ticketSearchQuery.trim()) {
        filteredTickets = filteredTickets.filter(ticket =>
          ticket.ticket.title.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          ticket.ticket.description.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
          ticket.ticketType?.toLowerCase().includes(ticketSearchQuery.toLowerCase())
        );
      }

      // Apply pagination
      const totalCount = filteredTickets.length;
      const totalPages = Math.ceil(totalCount / ticketPageSize);
      const startIndex = (ticketCurrentPage - 1) * ticketPageSize;
      const endIndex = startIndex + ticketPageSize;
      const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

      return {
        tickets: paginatedTickets,
        totalCount,
        totalPages,
        currentPage: ticketCurrentPage,
        hasNextPage: ticketCurrentPage < totalPages,
        hasPreviousPage: ticketCurrentPage > 1
      };
    },
    enabled: !!groupId,
  });

  // Fetch group events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['group-events', groupId],
    queryFn: () => GroupEventService.getGroupEvents(groupId!),
    enabled: !!groupId,
  });

  // Fetch group grades
  const { data: grades, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['group-grades', groupId],
    queryFn: () => GroupGradeService.getGroupGrades(groupId!),
    enabled: !!groupId,
  });

  // Fetch group chat messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: () => GroupChatService.getGroupMessages(groupId!),
    enabled: !!groupId,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: ({ ticketData, ticketType }: { ticketData: any; ticketType: GroupTicketType }) =>
      GroupTicketService.createGroupTicket(groupId!, ticketData, ticketType, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-tickets'] });
      setIsCreateTicketOpen(false);
      toast.success('Ticket created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create ticket');
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: ({ eventData, eventType }: { eventData: any; eventType: GroupEventType }) =>
      GroupEventService.createGroupEvent(groupId!, eventData, eventType, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-events'] });
      setIsCreateEventOpen(false);
      toast.success('Event created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create event');
    },
  });

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: ({ userId, gradeData }: { userId: string; gradeData: any }) =>
      GroupGradeService.createGroupGrade(groupId!, userId, gradeData, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-grades'] });
      setIsCreateGradeOpen(false);
      toast.success('Grade recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record grade');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      GroupChatService.sendMessage(groupId!, user!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-messages'] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  // Update group settings mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (settings: typeof groupSettings) => {
      const result = await GroupService.updateGroup(groupId!, settings as any, user!.id);
      return result;
    },
    onSuccess: (updatedGroup) => {
      // Update the cache directly with the new data
      queryClient.setQueryData(['group', groupId], (oldData: any) => ({
        ...oldData,
        ...updatedGroup
      }));

      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      // Force refetch the group data
      queryClient.refetchQueries({ queryKey: ['group', groupId] });

      toast.success('Group settings updated successfully!');
      setIsManageGroupOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update group settings');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => GroupService.removeMember(groupId!, memberId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Member removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: string }) =>
      GroupService.updateMemberRole(groupId!, memberId, newRole as any, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      toast.success('Member role updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member role');
    },
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleSaveGroupSettings = () => {
    updateGroupMutation.mutate(groupSettings);
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleUpdateMemberRole = (memberId: string, newRole: string) => {
    updateMemberRoleMutation.mutate({ memberId, newRole });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'not_attending':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoadingGroup) {
    return (
      <div className="container mx-auto p-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  // Handle access denied or group not found
  if (groupError || !group) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {groupError ? 'Access Denied' : 'Group not found'}
        </h1>
        <p className="text-muted-foreground mb-4">
          {groupError
            ? 'You do not have permission to view this group.'
            : 'The group you are looking for does not exist.'
          }
        </p>
        <Button onClick={() => navigate('/groups')}>
          Back to Groups
        </Button>
      </div>
    );
  }

  // Check if user is a member (additional frontend validation)
  if (userMembership === false) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You are not a member of this group. Please contact the group administrator to join.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => navigate('/groups')}>
            Back to Groups
          </Button>
          <Button variant="outline" onClick={() => {
            // TODO: Implement join group functionality
            toast.info('Join group functionality coming soon');
          }}>
            Request to Join
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/groups')}>
            ← Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">
              {group.courseCode} • {group.semester} • {group.memberCount} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GroupAIAssistant
            groupId={groupId!}
            groupName={group.name}
            courseCode={group.courseCode}
            className="mr-2"
          />
          {canManageGroups && (
            <Button variant="outline" onClick={() => setIsManageGroupOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Group
            </Button>
          )}
        </div>
      </div>

      {/* Group Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">
                {group.description || 'No description provided'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Settings</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={group.isPublic ? 'default' : 'secondary'}>
                    {group.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={group.allowSelfJoin ? 'default' : 'secondary'}>
                    {group.allowSelfJoin ? 'Open Join' : 'Invite Only'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Instructor</h4>
              {group.instructor ? (
                <div className="flex items-center gap-2">
                  <SmartAvatar
                    name={group.instructor.fullName || group.instructor.email}
                    avatarUrl={null}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{group.instructor.fullName}</p>
                    <p className="text-sm text-muted-foreground">{group.instructor.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No instructor assigned</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Tickets */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Tickets</CardTitle>
                {canManageGroups && (
                  <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Group Ticket</DialogTitle>
                        <DialogDescription>
                          Create a new ticket for the group with AI-powered suggestions.
                        </DialogDescription>
                      </DialogHeader>
                      <UnifiedTicketCreation
                        onSubmit={async (data) => {
                          try {
                            await createTicketMutation.mutateAsync({
                              ticketData: {
                                ...data,
                                courseCode: group?.courseCode,
                                className: group?.className,
                                projectGroup: group?.name
                              },
                              ticketType: data.type as GroupTicketType
                            });
                          } catch (error) {
                            console.error('Failed to create ticket:', error);
                          }
                        }}
                        onCancel={() => setIsCreateTicketOpen(false)}
                        initialData={{
                          courseCode: group?.courseCode,
                          className: group?.className,
                          projectGroup: group?.name
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : ticketsData && ticketsData.tickets.length > 0 ? (
                  <div className="space-y-3">
                    {ticketsData.tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{ticket.ticket.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.ticketType?.replace('_', ' ') || 'Unknown Type'} • {ticket.ticket.createdAt ? formatDistanceToNow(new Date(ticket.ticket.createdAt)) : 'Unknown time'} ago
                          </p>
                        </div>
                        <Badge variant="outline">{ticket.ticket.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No tickets yet</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Events</CardTitle>
                {canManageGroups && (
                  <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Group Event</DialogTitle>
                        <DialogDescription>
                          Create a new event for the group.
                        </DialogDescription>
                      </DialogHeader>
                      <CreateEventForm
                        onSubmit={(data) => createEventMutation.mutate(data)}
                        isLoading={createEventMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-3">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{event.event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event.startDate), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline">{event.eventType?.replace('_', ' ') || 'Unknown Type'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No events scheduled</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Grades */}
          {canGradeStudents && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Grades</CardTitle>
                <Dialog open={isCreateGradeOpen} onOpenChange={setIsCreateGradeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
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
              </CardHeader>
              <CardContent>
                {isLoadingGrades ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : grades && grades.length > 0 ? (
                  <div className="space-y-3">
                    {grades.slice(0, 5).map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{grade.user.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {grade.gradeType?.replace('_', ' ') || 'Unknown Type'} • {grade.gradedAt ? formatDistanceToNow(new Date(grade.gradedAt)) : 'Unknown time'} ago
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{grade.score}/{grade.maxScore}</p>
                          <Badge variant="outline">{grade.gradeType}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No grades recorded</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Members</CardTitle>
              <CardDescription>
                {members?.length || 0} members in this group
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role?.replace('_', ' ') || 'Unknown Role'}</span>
                        </Badge>
                        {canManageGroupMembers && (
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No members found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Group Tickets</CardTitle>
              {canManageGroups && (
                <Button onClick={() => setShowCreateTicketForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ticket
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search tickets..."
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={ticketFilters.status || 'all'}
                    onValueChange={(value) => setTicketFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={ticketFilters.priority || 'all'}
                    onValueChange={(value) => setTicketFilters(prev => ({ ...prev, priority: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={ticketFilters.type || 'all'}
                    onValueChange={(value) => setTicketFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="grading">Grading</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tickets Grid */}
              {isLoadingTickets ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : ticketsData && ticketsData.tickets.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ticketsData.tickets.map((ticket) => (
                      <GroupTicketCard
                        key={ticket.id}
                        ticket={ticket.ticket}
                        onClick={() => navigate(`/tickets/${ticket.ticket.id}`)}
                        canEdit={canManageGroups}
                        canDelete={canManageGroups}
                        onEdit={() => {
                          // TODO: Implement edit functionality
                          toast.info('Edit functionality coming soon');
                        }}
                        onDelete={() => {
                          // TODO: Implement delete functionality
                          toast.info('Delete functionality coming soon');
                        }}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {ticketsData.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={ticketsData.currentPage}
                        totalPages={ticketsData.totalPages}
                        onPageChange={setTicketCurrentPage}
                        showPageSize={true}
                        pageSize={ticketPageSize}
                        onPageSizeChange={setTicketPageSize}
                        totalItems={ticketsData.totalCount}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                  <p className="text-muted-foreground mb-4">
                    {ticketSearchQuery || Object.values(ticketFilters).some(f => f && f !== 'all')
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first group ticket'
                    }
                  </p>
                  {canManageGroups && (
                    <Button onClick={() => setShowCreateTicketForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Ticket
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <GroupCalendar
            groupId={groupId!}
            groupName={group.name}
            courseCode={group.courseCode}
          />
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <GroupGrades
            groupId={groupId!}
            groupName={group.name}
            courseCode={group.courseCode}
          />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
              <CardDescription>
                Real-time communication with group members
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {isLoadingMessages ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <SmartAvatar
                        name={message.user.fullName || message.user.email}
                        avatarUrl={message.user.avatarUrl}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{message.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.createdAt
                              ? `${message.createdAt ? formatDistanceToNow(new Date(message.createdAt)) : 'Unknown time'} ago`
                              : 'Just now'
                            }
                          </p>
                        </div>
                        <p className="text-sm mt-1">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No messages yet</p>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Manage Group Dialog */}
      <Dialog open={isManageGroupOpen} onOpenChange={setIsManageGroupOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Group: {group.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive group management with advanced features
            </DialogDescription>
          </DialogHeader>

          {/* Management Tabs */}
          <Tabs value={manageGroupTab} onValueChange={setManageGroupTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Group Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={groupSettings.name}
                      onChange={(e) => setGroupSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxMembers">Max Members</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={groupSettings.maxMembers}
                      onChange={(e) => setGroupSettings(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 100 }))}
                      placeholder="Enter max members"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={groupSettings.description}
                    onChange={(e) => setGroupSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter group description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={groupSettings.isPublic}
                      onChange={(e) => setGroupSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                    />
                    <Label htmlFor="isPublic">Public Group</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowSelfJoin"
                      checked={groupSettings.allowSelfJoin}
                      onChange={(e) => setGroupSettings(prev => ({ ...prev, allowSelfJoin: e.target.checked }))}
                    />
                    <Label htmlFor="allowSelfJoin">Allow Self Join</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Member Management
                  </h3>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                </div>

                <div className="space-y-2">
                  {members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <SmartAvatar
                          name={member.user?.fullName || 'Unknown'}
                          avatarUrl={member.user?.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">{member.user?.fullName}</p>
                          <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'instructor' ? 'default' : 'outline'}>
                          {member.role === 'instructor' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role === 'group_leader' && <Shield className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {canManageGroupMembers && (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => handleUpdateMemberRole(member.id, newRole)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="group_leader">Group Leader</SelectItem>
                                  {user?.role === 'instructor' && (
                                    <SelectItem value="instructor">Instructor</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={member.role === 'instructor'}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permission Settings
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Member Permissions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Can create tickets</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Can send messages</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Can view grades</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Can invite others</Label>
                        <input type="checkbox" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Group Leader Permissions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Can manage members</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Can create events</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Can grade assignments</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Group Analytics
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Tickets</span>
                          <span className="font-medium">{ticketsData?.totalCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Active Events</span>
                          <span className="font-medium">{events?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Messages Sent</span>
                          <span className="font-medium">{messages?.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Member Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Active Members</span>
                          <span className="font-medium">{members?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Participation Rate</span>
                          <span className="font-medium">85%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg. Response Time</span>
                          <span className="font-medium">2.5h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Quick Actions</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Group Resources
                  </h3>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Course Syllabus</p>
                        <p className="text-sm text-muted-foreground">PDF • 2.3 MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Link className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Project Guidelines</p>
                        <p className="text-sm text-muted-foreground">External Link</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Quick Links</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Group
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Invite Link
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email notifications</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Push notifications</Label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Weekly summary</Label>
                        <input type="checkbox" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Privacy</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Hide member list</Label>
                        <input type="checkbox" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Require approval for joins</Label>
                        <input type="checkbox" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Danger Zone</h4>
                    <div className="space-y-2">
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </Button>
                      <Button variant="outline" size="sm">
                        <Lock className="h-4 w-4 mr-2" />
                        Archive Group
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsManageGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroupSettings} disabled={updateGroupMutation.isPending}>
              {updateGroupMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Ticket Creation Dialog */}
      <Dialog open={showCreateTicketForm} onOpenChange={setShowCreateTicketForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Group Ticket</DialogTitle>
            <DialogDescription>
              Create a new ticket for the group with AI-powered suggestions.
            </DialogDescription>
          </DialogHeader>
          <UnifiedTicketCreation
            onSubmit={async (data) => {
              try {
                // Map UnifiedTicketCreation type to GroupTicketType
                const mapToGroupTicketType = (type: string): GroupTicketType => {
                  switch (type) {
                    case 'bug':
                    case 'technical':
                      return 'individual_support';
                    case 'feature':
                    case 'assignment':
                      return 'group_collaborative';
                    case 'question':
                    case 'academic':
                      return 'group_discussion';
                    case 'grading':
                    case 'exam':
                      return 'teacher_request';
                    default:
                      return 'individual_support';
                  }
                };

                await createTicketMutation.mutateAsync({
                  ticketData: {
                    ...data,
                    courseCode: group?.courseCode,
                    className: group?.className,
                    projectGroup: group?.name
                  },
                  ticketType: mapToGroupTicketType(data.type)
                });
              } catch (error) {
                console.error('Failed to create ticket:', error);
              }
            }}
            onCancel={() => setShowCreateTicketForm(false)}
            initialData={{
              courseCode: group?.courseCode,
              className: group?.className,
              projectGroup: group?.name
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Form Components
interface CreateEventFormProps {
  onSubmit: (data: { eventData: any; eventType: GroupEventType }) => void;
  isLoading: boolean;
}

const CreateEventForm = ({ onSubmit, isLoading }: CreateEventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'study_session' as GroupEventType,
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      eventData: {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      },
      eventType: formData.eventType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the event"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType">Event Type</Label>
        <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value as GroupEventType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="study_session">Study Session</SelectItem>
            <SelectItem value="assignment_deadline">Assignment Deadline</SelectItem>
            <SelectItem value="exam_schedule">Exam Schedule</SelectItem>
            <SelectItem value="group_meeting">Group Meeting</SelectItem>
            <SelectItem value="teacher_office_hours">Teacher Office Hours</SelectItem>
            <SelectItem value="project_presentation">Project Presentation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date & Time</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date & Time (Optional)</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Room A101"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
          <Input
            id="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
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
            {members.map((member) => (
              <SelectItem key={member.id} value={member.userId}>
                {member.user.fullName} ({member.user.email})
              </SelectItem>
            ))}
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
            <SelectItem value="assignment">Assignment</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="group_project">Group Project</SelectItem>
            <SelectItem value="individual_contribution">Individual Contribution</SelectItem>
            <SelectItem value="peer_review">Peer Review</SelectItem>
            <SelectItem value="attendance">Attendance</SelectItem>
            <SelectItem value="participation">Participation</SelectItem>
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
