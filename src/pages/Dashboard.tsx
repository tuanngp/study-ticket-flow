import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FeedLayout } from "@/components/FeedLayout";
import { FeedTicketCard } from "@/components/FeedTicketCard";
import { UnifiedTicketCreation } from "@/components/UnifiedTicketCreation";
import { Pagination } from "@/components/Pagination";
import { TicketOperationsService, Ticket } from "@/services/ticketOperationsService";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    priority: undefined as string | undefined,
    type: undefined as string | undefined,
    dateRange: undefined as string | undefined,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTickets = async (userId: string, page: number = currentPage, size: number = pageSize) => {
    try {
      const result = await TicketOperationsService.getTicketsPaginated({
        page,
        limit: size,
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        courseCode: filters.dateRange !== 'all' ? filters.dateRange : undefined,
      });

      setTickets(result.tickets);
      setFilteredTickets(result.tickets);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTickets(user.id, 1, pageSize);
      setCurrentPage(1);
    }
  }, [filters, pageSize]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets(tickets);
    }
  }, [tickets, searchQuery]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (user?.id) {
      fetchTickets(user.id);

      // Set up real-time subscription for tickets
      const unsubscribe = TicketOperationsService.subscribeToTickets(() => {
        fetchTickets(user.id);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [user, authLoading, isAuthenticated, navigate]);

  const handleCreateTicket = async (ticketData: any) => {
    try {
      console.log('Creating ticket with data:', ticketData);
      console.log('User ID:', user.id);

      // Create ticket using the service
      const newTicket = await TicketOperationsService.createTicket(ticketData, user.id);
      console.log('Ticket created successfully:', newTicket);

      toast.success('Ticket created successfully!');
      setShowCreateForm(false);

      // Refresh tickets to show the new one
      if (user?.id) {
        await fetchTickets(user.id);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(`Failed to create ticket: ${error.message}`);
    }
  };

  const handleTicketClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  // Pagination handlers
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    if (user?.id) {
      await fetchTickets(user.id, page, pageSize);
    }
  };

  const handlePageSizeChange = async (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    if (user?.id) {
      await fetchTickets(user.id, 1, size);
    }
  };

  if (authLoading) {
    return <FullPageLoadingSpinner />;
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <UnifiedTicketCreation
            onSubmit={handleCreateTicket}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <FeedLayout
      onCreateTicket={() => setShowCreateForm(true)}
      user={user}
      profile={profile}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filters}
      onFilterChange={setFilters}
    >
      {filteredTickets.length === 0 ? (
        // Empty state
        <div className="col-span-full text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first ticket to get started with the support system.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create First Ticket
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Ticket cards */}
          {filteredTickets.map((ticket) => (
            <FeedTicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket.id)}
              onEdit={() => navigate(`/tickets/${ticket.id}?edit=true`)}
              onDelete={() => {
                // Handle delete
                console.log('Delete ticket:', ticket.id);
              }}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="col-span-full mt-8 mb-20 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                hasNextPage={currentPage < totalPages}
                hasPreviousPage={currentPage > 1}
              />
            </div>
          )}
        </>
      )}
    </FeedLayout>
  );
};

export default Dashboard;
