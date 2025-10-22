import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AIAssistantWidget } from "./components/AIAssistantWidget";
import { ProfileLayout } from "./components/ProfileLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDocuments from "./pages/AdminDocuments";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NewTicket from "./pages/NewTicket";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import TicketDetail from "./pages/TicketDetail";
import TestEducationalTypes from "./pages/TestEducationalTypes";
import UserHome from "./pages/UserHome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/userhome" element={<UserHome />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileLayout>
                  <Profile />
                </ProfileLayout>
              </ProtectedRoute>
            } />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/tickets/new" element={<NewTicket />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/test-educational-types" element={<TestEducationalTypes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistantWidget />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
