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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserHomeSidebarProps {
  user: any;
  profile: any;
  onClose?: () => void;
  isMobile?: boolean;
}

export const UserHomeSidebar = ({ user, profile, onClose, isMobile = false }: UserHomeSidebarProps) => {
  const navigate = useNavigate();
  const { theme, setTheme, actualTheme } = useTheme();

  const handleSignOut = async () => {
    const { error } = await AuthService.signOut();

    if (error) {
      toast.error("Failed to sign out");
      return;
    }

    toast.success("Signed out successfully");
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
      icon: BarChart3,
      onClick: () => handleNavigation("/analytics"),
    },
    {
      title: "My Tickets",
      icon: Ticket,
      onClick: () => handleNavigation("/dashboard"),
    },
    {
      title: "Calendar",
      icon: Calendar,
      onClick: () => handleNavigation("/calendar"),
    },
    {
      title: "Notifications",
      icon: Bell,
      onClick: () => handleNavigation("/notifications"),
    },
  ];

  // Add Knowledge Base for instructors
  const instructorMenuItems = profile?.role === 'instructor' ? [
    {
      title: "Knowledge Base",
      icon: BookOpen,
      onClick: () => handleNavigation("/knowledge-base"),
    },
  ] : [];

  const allMenuItems = [...menuItems, ...instructorMenuItems];

  return (
    <Sidebar
      variant="inset"
      className={`border-r bg-gradient-to-b from-card to-card/50 transition-all duration-300 ease-in-out ${isMobile ? 'w-full' : ''}`}
    >
      <SidebarHeader className="p-6 border-b border-border/50">
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

          {/* Avatar with enhanced styling */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigation("/profile");
              }}
              className="hover:opacity-80 transition-all duration-200 ease-in-out hover:scale-105"
            >
              <SmartAvatar
                name={profile?.full_name || user?.email || 'User'}
                avatarUrl={profile?.avatar_url}
                size="xl"
              />
            </button>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-card rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          {/* User Info with better styling */}
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg text-foreground">
              {profile?.full_name || user?.email}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <p className="text-sm text-muted-foreground capitalize font-medium">
                {profile?.role || "student"}
              </p>
            </div>
          </div>

          {/* Enhanced Theme Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-full gap-2 bg-background/50 hover:bg-background/80 border-border/50"
          >
            {getThemeIcon()}
            <span className="text-sm font-medium">{getThemeLabel()} Mode</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {allMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    className="w-full justify-start gap-3 h-11 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-6 bg-border/50" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleNavigation("/settings")}
                  className="w-full justify-start gap-3 h-11 rounded-lg hover:bg-accent/50 transition-all duration-200 ease-in-out group"
                >
                  <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="font-medium">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full justify-start gap-3 h-11 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 ease-in-out group"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
