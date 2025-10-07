import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Sparkles, BarChart3, Users, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const features = [
    {
      icon: Ticket,
      title: "Smart Ticket Management",
      description: "Create, track, and manage tickets with an intuitive interface designed for academic teams",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Triage",
      description: "Automatic categorization, priority assignment, and smart routing based on ticket content",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time insights into team performance, ticket trends, and workload distribution",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Flexible permissions for students, project leads, and instructors",
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
              TicketFlow AI
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="bg-gradient-primary hover:shadow-glow"
                  >
                    Get Started
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
              AI-Powered Ticket Management
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Intelligent Ticketing for
              <span className="text-transparent bg-clip-text bg-gradient-primary"> Academic Teams</span>
            </h1>
            
            <p className="text-xl text-muted-foreground">
              Streamline your project workflow with AI-assisted ticket management. 
              Perfect for student projects, capstone teams, and academic collaboration.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
                className="bg-gradient-primary hover:shadow-glow text-lg px-8"
              >
                Start Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                View Demo
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
            <img
              src={heroImage}
              alt="TicketFlow Dashboard"
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built specifically for academic environments with powerful features 
            to help teams collaborate effectively
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
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join academic teams already using TicketFlow AI to manage 
              their projects more efficiently
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Get Started Free
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
