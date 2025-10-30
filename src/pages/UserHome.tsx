import { KnowledgeBaseCard } from '@/components/KnowledgeBaseCard';
import { KnowledgeBaseQuickActions } from '@/components/KnowledgeBaseQuickActions';
import { FullPageLoadingSpinner } from '@/components/LoadingSpinner';
import { StatsCards } from '@/components/StatsCards';
import { TicketList } from '@/components/TicketList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { UserHomeSidebar } from '@/components/UserHomeSidebar';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Calendar, Plus, Ticket, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserHome = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return <FullPageLoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <UserHomeSidebar user={user} profile={profile} />

        <SidebarInset>
          <main className="flex-1 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Chào mừng trở lại</h1>
                <p className="text-muted-foreground">
                  Xin chào, {profile?.full_name || user?.email}! Đây là tổng quan của bạn.
                </p>
              </div>
              <Button
                onClick={() => navigate("/tickets/new")}
                className="bg-gradient-primary hover:shadow-glow"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo Ticket
              </Button>
            </div>

            {/* Quick Stats */}
            <StatsCards userId={user?.id} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Recent Tickets */}
              <div className="lg:col-span-2">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Ticket Gần Đây
                    </CardTitle>
                    <CardDescription>
                      Hoạt động ticket mới nhất của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TicketList userId={user?.id} />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Thao Tác Nhanh
                    </CardTitle>
                    <CardDescription>
                      Các tác vụ và phím tắt thường dùng
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => navigate("/tickets/new")}
                    >
                      <Plus className="h-4 w-4" />
                      Tạo Ticket
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => navigate("/analytics")}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Xem Phân Tích
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => navigate("/calendar")}
                    >
                      <Calendar className="h-4 w-4" />
                      Mở Lịch
                    </Button>
                  </CardContent>
                </Card>

                {/* Knowledge Base Card - Only for Instructors */}
                {profile?.role === 'instructor' && user?.id && (
                  <>
                    <KnowledgeBaseCard instructorId={user.id} />
                    <KnowledgeBaseQuickActions instructorId={user.id} />
                  </>
                )}

                {/* Profile Summary */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Tóm Tắt Hồ Sơ</CardTitle>
                    <CardDescription>
                      Thông tin tài khoản của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vai trò:</span>
                      <span className="text-sm font-medium capitalize">
                        {profile?.role === 'student' ? 'Sinh viên' : profile?.role === 'instructor' ? 'Giảng viên' : profile?.role === 'admin' ? 'Quản trị viên' : profile?.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium">
                        {user?.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Thành viên từ:</span>
                      <span className="text-sm font-medium">
                        {new Date(user?.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default UserHome;
