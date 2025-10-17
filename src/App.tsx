import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AIAssistantWidget } from "./components/AIAssistantWidget";
import AdminDocuments from "./pages/AdminDocuments";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NewTicket from "./pages/NewTicket";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import TicketDetail from "./pages/TicketDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/tickets/new" element={<NewTicket />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIAssistantWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
