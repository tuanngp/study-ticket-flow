import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Sparkles, BarChart3, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Ticket,
      title: "Quản lý Ticket Thông minh",
      description: "Tạo, theo dõi và quản lý ticket với giao diện trực quan được thiết kế cho các nhóm học tập",
    },
    {
      icon: Sparkles,
      title: "AI Triage Thông minh",
      description: "Tự động phân loại, gán mức độ ưu tiên và định tuyến thông minh dựa trên nội dung ticket",
    },
    {
      icon: BarChart3,
      title: "Dashboard Phân tích",
      description: "Thông tin chi tiết theo thời gian thực về hiệu suất nhóm, xu hướng ticket và phân bổ khối lượng công việc",
    },
    {
      icon: Users,
      title: "Truy cập theo Vai trò",
      description: "Quyền hạn linh hoạt cho sinh viên, trưởng nhóm dự án và giảng viên",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              EduTicket AI
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  Đến Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    Bắt đầu
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Quản lý Ticket với AI
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Ticket Thông minh cho
              <span className="text-transparent bg-clip-text bg-gradient-primary"> Nhóm Học tập</span>
            </h1>

            <p className="text-xl text-muted-foreground">
              Tối ưu hóa quy trình làm việc dự án với quản lý ticket hỗ trợ AI.
              Hoàn hảo cho các dự án sinh viên, nhóm capstone và hợp tác học thuật.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
                className="bg-gradient-primary hover:shadow-glow text-lg px-8"
              >
                Bắt đầu miễn phí
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                Xem Demo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
            <img
              src={heroImage}
              alt="EduTicket Dashboard"
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Tất cả những gì bạn cần</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Được xây dựng đặc biệt cho môi trường học thuật với các tính năng mạnh mẽ
            để giúp các nhóm hợp tác hiệu quả
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow border-2">
              <CardHeader>
                <div className="p-3 bg-gradient-primary rounded-xl w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-primary text-white shadow-glow">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Sẵn sàng chuyển đổi quy trình làm việc?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Tham gia cùng các nhóm học thuật đã sử dụng EduTicket AI để quản lý
              dự án hiệu quả hơn
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Bắt đầu miễn phí
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Ticket className="h-4 w-4 text-white" />
              </div>
              TicketFlow AI
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 TicketFlow AI. Built for academic excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
