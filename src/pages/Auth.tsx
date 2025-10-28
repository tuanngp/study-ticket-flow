import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Ticket,
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Shield,
  CheckCircle,
  Star,
  Zap,
  Home
} from "lucide-react";
import { AuthService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, error } = await AuthService.signUp({
        email,
        password,
        fullName,
        role,
      });

      if (error) {
        throw new Error(error);
      }

      if (user) {
        toast.success("Account created successfully!");
        // Don't navigate here - let AuthContext handle it
        // The useEffect above will redirect when isAuthenticated becomes true
      }
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, error } = await AuthService.signIn({
        email,
        password,
      });

      if (error) {
        throw new Error(error);
      }

      if (user) {
        toast.success("Signed in successfully!");
        window.location.href = '/dashboard';
      } else {
        throw new Error('No user returned from sign in');
      }
    } catch (error: any) {
      toast.error(error.message || "Error signing in");
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Phân loại thông minh",
      description: "AI tự động phân loại và ưu tiên ticket"
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Tập trung giáo dục",
      description: "Được thiết kế đặc biệt cho môi trường học thuật"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Hợp tác nhóm",
      description: "Giao tiếp liền mạch giữa sinh viên và giảng viên"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Bảo mật & Tin cậy",
      description: "Bảo mật cấp doanh nghiệp cho trường đại học"
    }
  ];

  const roleDescriptions = {
    student: {
      icon: <User className="h-4 w-4" />,
      title: "Sinh viên",
      description: "Tạo ticket, theo dõi tiến độ và nhận hỗ trợ từ giảng viên",
      features: ["Gửi yêu cầu hỗ trợ", "Theo dõi trạng thái ticket", "Truy cập tài liệu học tập"]
    },
    instructor: {
      icon: <GraduationCap className="h-4 w-4" />,
      title: "Giảng viên",
      description: "Quản lý ticket, cung cấp hướng dẫn và theo dõi tiến độ sinh viên",
      features: ["Xem và phân công ticket", "Cung cấp hướng dẫn chuyên môn", "Xem bảng điều khiển phân tích"]
    },
    admin: {
      icon: <Shield className="h-4 w-4" />,
      title: "Quản trị viên",
      description: "Quyền truy cập đầy đủ hệ thống với quản lý người dùng và cấu hình hệ thống",
      features: ["Quản lý người dùng và vai trò", "Cấu hình hệ thống", "Phân tích nâng cao"]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      {/* Header with Home Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 dark:hover:bg-gradient-to-r dark:hover:from-blue-600 dark:hover:to-indigo-600 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Về trang chủ</span>
        </Button>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-md">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-75"></div>
                <div className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Ticket className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  EduTicket AI
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Hệ thống hỗ trợ học tập thông minh
                </p>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Chuyển đổi
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Hỗ trợ học tập</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Hệ thống quản lý ticket được hỗ trợ bởi AI, được thiết kế đặc biệt cho Đại học FPT Đà Nẵng.
                Tối ưu hóa hỗ trợ, nâng cao học tập và cải thiện thành công của sinh viên.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-slate-600 dark:text-slate-400">4.9/5 Đánh giá</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-slate-600 dark:text-slate-400">10K+ Người dùng</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-slate-600 dark:text-slate-400">99.9% Hoạt động</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-75"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    EduTicket AI
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Đại học FPT Đà Nẵng
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Chào mừng đến EduTicket AI
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Đăng nhập vào tài khoản hoặc tạo tài khoản mới
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-700">
                    <TabsTrigger
                      value="signin"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-600"
                    >
                      Đăng nhập
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-600"
                    >
                      Đăng ký
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Địa chỉ Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="sinhvien@fpt.edu.vn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Mật khẩu
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang đăng nhập...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Đăng nhập
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Họ và tên
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Nguyễn Văn A"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10 h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Địa chỉ Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="sinhvien@fpt.edu.vn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Mật khẩu
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Tối thiểu 6 ký tự
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-role" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Vai trò
                        </Label>
                        <Select value={role} onValueChange={(value: 'student' | 'instructor' | 'admin') => setRole(value)}>
                          <SelectTrigger className="h-11 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue placeholder="Chọn vai trò của bạn" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(roleDescriptions).map(([key, roleInfo]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  {roleInfo.icon}
                                  <span>{roleInfo.title}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Role Description */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <div className="flex items-start gap-2 mb-2">
                            {roleDescriptions[role].icon}
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                              {roleDescriptions[role].title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            {roleDescriptions[role].description}
                          </p>
                          <div className="space-y-1">
                            {roleDescriptions[role].features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Đang tạo tài khoản...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            Tạo tài khoản
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/')}
                      className="flex items-center gap-2 text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white border-slate-200 dark:border-slate-600 hover:border-transparent dark:hover:border-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 dark:hover:bg-gradient-to-r dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all duration-200 hover:shadow-lg"
                    >
                      <Home className="h-4 w-4" />
                      Về trang chủ
                    </Button>
                  </div>
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Bằng cách đăng ký, bạn đồng ý với{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      Điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      Chính sách bảo mật
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
