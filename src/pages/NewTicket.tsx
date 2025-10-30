import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { UnifiedTicketCreation } from "@/components/UnifiedTicketCreation";
import { AuthService, UserProfile } from "@/services/authService";
import { AITriageResult, TicketFormData, TicketService } from "@/services/ticketService";
import { t } from "@/lib/translations";
import {
  ArrowLeft
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const NewTicket = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [formData, setFormData] = useState<TicketFormData>({
    title: "",
    description: "",
    type: "task",
    priority: "medium",
  });

  // Educational context
  const [courseCode, setCourseCode] = useState("");
  const [className, setClassName] = useState("");
  const [projectGroup, setProjectGroup] = useState("");

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<AITriageResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Unified creation system
  const [isCreating, setIsCreating] = useState(false);

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
        console.error('Auth check failed:', error);
        navigate("/auth");
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Auto-analyze when form data changes
  useEffect(() => {
    const analyzeTicket = async () => {
      if (formData.title.length > 10 && formData.description.length > 20) {
        setIsAnalyzing(true);
        try {
          const suggestions = await TicketService.getAITriageSuggestions(formData);
          setAiSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('AI analysis failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    const timeoutId = setTimeout(analyzeTicket, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t("tickets.createFailed"));
      return;
    }

    // Validate form data
    const validation = TicketService.validateTicketData(formData);
    if (!validation.isValid) {
      toast.error(validation.errors.join(", "));
      return;
    }

    setIsLoading(true);

    try {
      const createdTicket = await TicketService.createTicket(formData, user.id);

      toast.success(t("tickets.ticketCreated"));
      navigate(`/tickets/${createdTicket.id}`);
    } catch (error: any) {
      toast.error(error.message || t("tickets.createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("loading.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.backToDashboard")}
        </Button>

        {/* Unified Ticket Creation */}
        <UnifiedTicketCreation
          onSubmit={async (data) => {
            setIsCreating(true);
            try {
              const session = await AuthService.getCurrentSession();
              if (!session?.user) {
                toast.error(t("tickets.createFailed"));
                return;
              }

              const ticketData = {
                title: data.title,
                description: data.description,
                type: data.type,
                priority: data.priority,
              };

              const createdTicket = await TicketService.createTicket(ticketData, session.user.id);
              toast.success("Ticket created successfully!");
              navigate("/dashboard");
            } catch (error: any) {
              console.error('Failed to create ticket:', error);
              toast.error(error.message || "Failed to create ticket. Please try again.");
            } finally {
              setIsCreating(false);
            }
          }}
          onCancel={() => navigate("/dashboard")}
          initialData={{
            courseCode,
            className,
            projectGroup
          }}
        />
      </main>
    </div>
  );
};

export default NewTicket;
