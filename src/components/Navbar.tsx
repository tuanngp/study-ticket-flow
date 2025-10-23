import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/authService";
import { LogOut, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NotificationBell } from "./NotificationBell";
import { SmartAvatar } from "./SmartAvatar";

interface NavbarProps {
  user: any;
  profile: any;
}

export const Navbar = ({ user, profile }: NavbarProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await AuthService.signOut();

    if (error) {
      toast.error("Failed to sign out");
      return;
    }

    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              TicketFlow AI
            </button>
            
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <NotificationBell userId={user?.id} />
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 hover:bg-accent/50 rounded-lg p-2 transition-colors"
                >
                  <SmartAvatar 
                    name={profile?.full_name || user.email || 'User'} 
                    avatarUrl={profile?.avatar_url}
                    size="lg"
                  />
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-sm font-medium">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {profile?.role || "student"}
                    </p>
                  </div>
                </button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-primary hover:shadow-glow"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
