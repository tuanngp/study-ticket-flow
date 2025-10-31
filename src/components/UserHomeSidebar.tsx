import { SmartAvatar } from '@/components/SmartAvatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/services/authService';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  Ticket,
  Users,
  X
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserHomeSidebarProps {
  user?: any;
  profile?: any;
  onClose?: () => void;
  isMobile?: boolean;
}

export const UserHomeSidebar = ({ user: userProp, profile: profileProp, onClose, isMobile = false }: UserHomeSidebarProps) => {
  // Use profile from useAuth hook to ensure it's always up-to-date
  const { user: authUser, profile: authProfile } = useAuth();
  
  // Prefer props if provided, otherwise fallback to auth context
  const user = userProp || authUser;
  const profile = profileProp || authProfile;
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, actualTheme } = useTheme();

  // Check if a menu item is active based on current route
  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    const { error } = await AuthService.signOut();

    if (error) {
      toast.error("Không thể đăng xuất");
      return;
    }

    toast.success("Đăng xuất thành công");
    navigate("/");
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return actualTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return actualTheme === 'dark' ? 'Dark' : 'Light';
  };

  const handleNavigation = (path: string) => {
    // Smooth navigation without sidebar flicker
    setTimeout(() => {
      navigate(path);
    }, 50);

    if (isMobile && onClose) {
      onClose();
    }
  };

  const menuItems = [
    {
      title: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      onClick: () => handleNavigation("/analytics"),
    },
    {
      title: "My Tickets",
      path: "/dashboard",
      icon: Ticket,
      onClick: () => handleNavigation("/dashboard"),
    },
    {
      title: "Groups",
      path: "/groups",
      icon: Users,
      onClick: () => handleNavigation("/groups"),
    },
    {
      title: "Calendar",
      path: "/calendar",
      icon: Calendar,
      onClick: () => handleNavigation("/calendar"),
    },
    {
      title: "Notifications",
      path: "/notifications",
      icon: Bell,
      onClick: () => handleNavigation("/notifications"),
    },
  ];

  // Add Knowledge Base for instructors
  const instructorMenuItems = profile?.role === 'instructor' ? [
    {
      title: "Knowledge Base",
      path: "/knowledge-base",
      icon: BookOpen,
      onClick: () => handleNavigation("/knowledge-base"),
    },
  ] : [];

  const allMenuItems = [...menuItems, ...instructorMenuItems];

  return (
    <Sidebar
      variant="inset"
      className={`border-r bg-sidebar ${isMobile ? 'w-full' : ''}`}
    >
      <SidebarHeader className="p-5 border-b">
        <div className="flex flex-col items-center gap-4">
          {/* Mobile Close Button */}
          {isMobile && (
            <div className="w-full flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Avatar */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigation("/profile");
            }}
            className="relative hover:opacity-90 transition-opacity"
          >
            <SmartAvatar
              name={profile?.full_name || user?.email || 'User'}
              avatarUrl={profile?.avatar_url}
              size="xl"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-sidebar rounded-full"></div>
          </button>

          {/* User Info */}
          <div className="text-center space-y-1.5 w-full">
            <h3 className="font-semibold text-base text-foreground truncate w-full px-2">
              {profile?.full_name || user?.email || 'User'}
            </h3>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role === 'student' ? 'Sinh viên' : 
               profile?.role === 'instructor' ? 'Giảng viên' : 
               profile?.role === 'admin' ? 'Quản trị viên' : 
               profile?.role || "student"}
            </p>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-full gap-2"
          >
            {getThemeIcon()}
            <span className="text-sm">{getThemeLabel()} Mode</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-3 px-2">
            Điều hướng
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {allMenuItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={item.onClick}
                      className={`w-full justify-start gap-3 h-10 rounded-md transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {item.title === 'Analytics' ? 'Phân tích' :
                         item.title === 'My Tickets' ? 'Ticket của tôi' :
                         item.title === 'Groups' ? 'Nhóm' :
                         item.title === 'Calendar' ? 'Lịch' :
                         item.title === 'Notifications' ? 'Thông báo' :
                         item.title === 'Knowledge Base' ? 'Kiến thức' :
                         item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-3 px-2">
            Cài đặt
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigation("/settings")}
                  className={`w-full justify-start gap-3 h-10 rounded-md transition-colors ${
                    isActiveRoute('/settings')
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Cài đặt</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full justify-start gap-3 h-10 rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
