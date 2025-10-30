import { PeakHoursChart } from '@/components/charts/PeakHoursChart';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { TicketPriorityChart } from '@/components/charts/TicketPriorityChart';
import { TicketStatusChart } from '@/components/charts/TicketStatusChart';
import { TicketTrendsChart } from '@/components/charts/TicketTrendsChart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserHomeSidebar } from '@/components/UserHomeSidebar';
import { AuthService, UserProfile } from '@/services/authService';
import { ReviewResult, ReviewService, ReviewStats } from '@/services/reviewService';
import { StatisticsService } from '@/services/statisticsService';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MessageSquare,
  RefreshCw,
  Star,
  Target,
  ThumbsUp,
  Ticket,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsData {
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    averageResolutionTime: number;
    userSatisfaction: number;
    ticketViews?: number;
    ticketLikes?: number;
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

  // Reviews state
  const [userReviews, setUserReviews] = useState<ReviewResult[]>([]);
  const [reviewsStats, setReviewsStats] = useState<ReviewStats | null>(null);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const checkAuth = async () => {
      try {
        const session = await AuthService.getCurrentSession();

        if (!isMounted) return; // Check if component is still mounted

        if (!session) {
          navigate("/auth");
          return;
        }

        setUser(session.user);
        setProfile(session.profile);
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          navigate("/auth");
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false; // Cleanup
    };
  }, [navigate]);

  const { data: analyticsData, isLoading: isDataLoading, error, refetch } = useQuery({
    queryKey: ['analytics', user?.id, timeRange],
    queryFn: () => StatisticsService.getAnalyticsDashboard(user?.id, timeRange),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Limit retries
    retryDelay: 1000, // 1 second delay between retries
  });

  useEffect(() => {
    if (!user?.id) return;
    // Đăng ký realtime update thống kê khi tickets thay đổi
    const unsubscribe = StatisticsService.subscribeToStatsChanges(user.id, () => {
      refetch();
    });
    return () => unsubscribe && unsubscribe();
  }, [user?.id, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load reviews data with timeout
  const loadReviewsData = async () => {
    if (!user?.id) return;

    try {
      setIsReviewsLoading(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Reviews fetch timeout')), 15000)
      );

      const reviewsPromise = ReviewService.getReviewsByReviewer(user.id);
      const reviews = await Promise.race([reviewsPromise, timeoutPromise]) as ReviewResult[];

      setUserReviews(reviews);

      // Calculate overall stats from user's reviews
      if (reviews.length > 0) {
        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews;

        const ratingDistribution = reviews.reduce((acc, review) => {
          acc[review.overallRating] = (acc[review.overallRating] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const criteriaAverages = {
          quality: reviews.filter(r => r.qualityRating).reduce((sum, r) => sum + (r.qualityRating || 0), 0) / reviews.filter(r => r.qualityRating).length || 0,
          completeness: reviews.filter(r => r.completenessRating).reduce((sum, r) => sum + (r.completenessRating || 0), 0) / reviews.filter(r => r.completenessRating).length || 0,
          clarity: reviews.filter(r => r.clarityRating).reduce((sum, r) => sum + (r.clarityRating || 0), 0) / reviews.filter(r => r.clarityRating).length || 0,
          helpfulness: reviews.filter(r => r.helpfulnessRating).reduce((sum, r) => sum + (r.helpfulnessRating || 0), 0) / reviews.filter(r => r.helpfulnessRating).length || 0,
        };

        setReviewsStats({
          averageRating,
          totalReviews,
          ratingDistribution,
          criteriaAverages,
          recentReviews: reviews.slice(0, 5) // Add recent reviews
        });
      }
    } catch (error) {
      console.error('Failed to load reviews data:', error);
      // Set empty state on error
      setUserReviews([]);
      setReviewsStats(null);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  // Load reviews when user is available - with cleanup
  useEffect(() => {
    let isMounted = true;

    if (user?.id) {
      loadReviewsData();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <UserHomeSidebar user={user} profile={profile} />
          <SidebarInset className="flex-1">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Đang tải phân tích...</p>
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
      ticketViews: 0,
      ticketLikes: 0,
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
                  Bảng Phân Tích Của Tôi
                </h1>
                <p className="text-muted-foreground">
                  Thống kê cá nhân và thông tin chi tiết về ticket của bạn
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
                  Làm mới
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất dữ liệu
                </Button>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Khoảng thời gian:</span>
              <div className="flex gap-1">
                {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range === 'week' ? 'Tuần' : range === 'month' ? 'Tháng' : range === 'quarter' ? 'Quý' : 'Năm'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tổng Ticket</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overview.totalTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    Tổng số ticket của bạn
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Đang Mở</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{data.overview.openTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    Ticket đang hoạt động của bạn
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Đã Giải Quyết</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{data.overview.resolvedTickets}</div>
                  <p className="text-xs text-muted-foreground">
                    Ticket đã giải quyết của bạn
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Thời Gian TB</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overview.averageResolutionTime}h</div>
                  <p className="text-xs text-muted-foreground">
                    Thời gian giải quyết trung bình
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lượt Xem</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{data.overview.ticketViews ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Tổng lượt xem ticket của bạn
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lượt Thích</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">{data.overview.ticketLikes ?? 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Tổng lượt thích ticket của bạn
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Analytics Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
                <TabsTrigger value="trends">Xu Hướng</TabsTrigger>
                <TabsTrigger value="performance">Hiệu Suất</TabsTrigger>
                <TabsTrigger value="insights">Thông Tin</TabsTrigger>
                <TabsTrigger value="reviews">Đánh Giá</TabsTrigger>
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

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                {isReviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : userReviews.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">Chưa có đánh giá nào</h3>
                      <p className="text-muted-foreground mb-6">
                        Bạn chưa đánh giá ticket nào. Hãy đánh giá các ticket đã được giải quyết để xem thống kê ở đây.
                      </p>
                      <Button onClick={() => navigate('/dashboard')} variant="outline">
                        Xem Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Reviews Overview Stats */}
                    {reviewsStats && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng đánh giá</CardTitle>
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{reviewsStats.totalReviews}</div>
                            <p className="text-xs text-muted-foreground">
                              Đánh giá bạn đã thực hiện
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                              {reviewsStats.averageRating.toFixed(1)}/5
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Điểm đánh giá trung bình
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đánh giá cao nhất</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                              {Math.max(...userReviews.map(r => r.overallRating))}/5
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Điểm cao nhất bạn đã cho
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Rating Distribution */}
                    {reviewsStats && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Phân bố đánh giá của bạn
                          </CardTitle>
                          <CardDescription>
                            Thống kê các mức điểm bạn đã đánh giá
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = reviewsStats.ratingDistribution[rating] || 0;
                              const percentage = reviewsStats.totalReviews > 0 ? (count / reviewsStats.totalReviews) * 100 : 0;

                              return (
                                <div key={rating} className="flex items-center gap-3">
                                  <span className="text-sm font-medium w-6">{rating}</span>
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div
                                      className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-muted-foreground w-12 text-right">
                                    {count} ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Individual Reviews */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Đánh giá chi tiết của bạn
                        </CardTitle>
                        <CardDescription>
                          Danh sách tất cả các đánh giá bạn đã thực hiện
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {userReviews.map((review) => (
                            <div key={review.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.overallRating
                                          ? 'text-yellow-500 fill-yellow-500'
                                          : 'text-gray-300'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {review.overallRating}/5
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                </div>
                              </div>

                              {review.feedback && (
                                <p className="text-sm text-muted-foreground mb-3 bg-muted/50 p-3 rounded-lg">
                                  "{review.feedback}"
                                </p>
                              )}

                              {review.suggestions && (
                                <div className="text-sm">
                                  <span className="font-medium text-blue-600">Gợi ý:</span>
                                  <p className="text-muted-foreground mt-1">{review.suggestions}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default Analytics;
