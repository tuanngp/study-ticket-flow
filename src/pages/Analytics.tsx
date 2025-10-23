import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserHomeSidebar } from '@/components/UserHomeSidebar';
import { AuthService, UserProfile } from '@/services/authService';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { StatisticsService } from '@/services/statisticsService';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TicketStatusChart } from '@/components/charts/TicketStatusChart';
import { TicketTrendsChart } from '@/components/charts/TicketTrendsChart';
import { TicketPriorityChart } from '@/components/charts/TicketPriorityChart';
import { PeakHoursChart } from '@/components/charts/PeakHoursChart';
import { PerformanceChart } from '@/components/charts/PerformanceChart';

interface AnalyticsData {
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    averageResolutionTime: number;
    userSatisfaction: number;
  };
  trends: {
    ticketsByStatus: Array<{ status: string; count: number; percentage: number }>;
    ticketsByPriority: Array<{ priority: string; count: number; percentage: number }>;
    ticketsByType: Array<{ type: string; count: number; percentage: number }>;
    resolutionTimeByMonth: Array<{ month: string; averageTime: number }>;
  };
  performance: {
    topPerformers: Array<{ name: string; resolvedTickets: number; averageTime: number; rating: number }>;
    departmentStats: Array<{ department: string; tickets: number; resolutionTime: number; satisfaction: number }>;
    courseStats: Array<{ course: string; tickets: number; resolutionTime: number; satisfaction: number }>;
  };
  insights: {
    peakHours: Array<{ hour: number; ticketCount: number }>;
    commonIssues: Array<{ issue: string; count: number; trend: 'up' | 'down' | 'stable' }>;
    seasonalPatterns: Array<{ period: string; pattern: string; impact: number }>;
  };
}

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await AuthService.getCurrentSession();

        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);
        setProfile(session.profile);
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate("/auth");
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const { data: analyticsData, isLoading: isDataLoading, error, refetch } = useQuery({
    queryKey: ['analytics', user?.id, timeRange],
    queryFn: () => StatisticsService.getAnalyticsDashboard(user?.id, timeRange),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <UserHomeSidebar user={user} profile={profile} />
          <SidebarInset className="flex-1">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      resolved: "bg-green-500/10 text-green-500 border-green-500/20",
      closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  if (isDataLoading) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <UserHomeSidebar user={user} profile={profile} />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">My Analytics Dashboard</h1>
                  <p className="text-muted-foreground">Personal statistics and insights for your tickets</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <UserHomeSidebar user={user} profile={profile} />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              <Card className="border-destructive">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error loading the analytics data. Please try again.
                  </p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

  // Return loading state if data is not available yet
  if (!analyticsData) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <UserHomeSidebar user={user} profile={profile} />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">My Analytics Dashboard</h1>
                  <p className="text-muted-foreground">Personal statistics and insights for your tickets</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    );
  }

  const data = analyticsData as AnalyticsData || {
    overview: {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      averageResolutionTime: 0,
      userSatisfaction: 0,
    },
    trends: {
      ticketsByStatus: [],
      ticketsByPriority: [],
      ticketsByType: [],
      resolutionTimeByMonth: [],
    },
    performance: {
      topPerformers: [],
      departmentStats: [],
      courseStats: [],
    },
    insights: {
      peakHours: [],
      commonIssues: [],
      seasonalPatterns: [],
    },
  };

  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <UserHomeSidebar user={user} profile={profile} />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            My Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Personal statistics and insights for your tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Range:</span>
        <div className="flex gap-1">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              Your total tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.overview.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Your active tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.overview.resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">
              Your resolved tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averageResolutionTime}h</div>
            <p className="text-xs text-muted-foreground">
              Your average resolution time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Chart */}
            <TicketStatusChart data={data.trends.ticketsByStatus} />

            {/* Priority Distribution Chart */}
            <TicketPriorityChart data={data.trends.ticketsByPriority} />
          </div>

          {/* User Satisfaction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                User Satisfaction
              </CardTitle>
              <CardDescription>
                Overall satisfaction rating from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-green-600">
                  {data.overview.userSatisfaction}%
                </div>
                <div className="flex-1">
                  <Progress value={data.overview.userSatisfaction} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {data.overview.resolvedTickets} resolved tickets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Types */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Types</CardTitle>
                <CardDescription>
                  Distribution of tickets by type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.trends.ticketsByType.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resolution Time Trends Chart */}
            <TicketTrendsChart data={data.trends.resolutionTimeByMonth} />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers Chart */}
            <PerformanceChart data={data.performance.topPerformers} />

            {/* Department Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>
                  Performance by department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.performance.departmentStats.map((dept) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept.department}</span>
                      <span className="text-sm text-muted-foreground">
                        {dept.tickets} tickets
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={dept.satisfaction} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {dept.satisfaction}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>
                  Performance by course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.performance.courseStats.map((course) => (
                  <div key={course.course} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{course.course}</span>
                      <span className="text-sm text-muted-foreground">
                        {course.tickets} tickets
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={course.satisfaction} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {course.satisfaction}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours Chart */}
            <PeakHoursChart data={data.insights.peakHours} />

            {/* Common Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Common Issues
                </CardTitle>
                <CardDescription>
                  Most frequently reported issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.insights.commonIssues.map((issue) => (
                  <div key={issue.issue} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{issue.issue}</span>
                      <Badge variant="outline" className="text-xs">
                        {issue.trend === 'up' ? '↗️' : issue.trend === 'down' ? '↘️' : '➡️'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {issue.count} reports
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Seasonal Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonal Patterns
              </CardTitle>
              <CardDescription>
                Patterns and trends over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.insights.seasonalPatterns.map((pattern) => (
                <div key={pattern.period} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{pattern.period}</p>
                    <p className="text-xs text-muted-foreground">{pattern.pattern}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{pattern.impact}%</p>
                    <p className="text-xs text-muted-foreground">impact</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default Analytics;
