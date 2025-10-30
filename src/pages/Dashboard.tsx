import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FeedLayout } from "@/components/FeedLayout";
import { FeedTicketCard } from "@/components/FeedTicketCard";
import { UnifiedTicketCreation } from "@/components/UnifiedTicketCreation";
import { Pagination } from "@/components/Pagination";
import { TicketOperationsService, Ticket } from "@/services/ticketOperationsService";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Globe } from "lucide-react";
import { ViewService } from "@/services/viewService";

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
  const [activeTab, setActiveTab] = useState("my-tickets");
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const fetchingRef = useRef(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTickets = useCallback(async (
    userId: string,
    page: number = 1,
    tab: string = activeTab,
    customLimit?: number
  ) => {
    if (!userId || fetchingRef.current) return;

    try {
      fetchingRef.current = true;
      setIsLoadingTickets(true);

      let queryParams: any = {
        page,
        limit: customLimit ?? pageSize,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority && filters.priority !== 'all' ? filters.priority : undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        dateRange: filters.dateRange && filters.dateRange !== 'all' ? filters.dateRange : undefined,
        includeGroupTickets: true,
      };

      // Debug logging for date range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        console.log('Dashboard: Applying date range filter', {
          dateRange: filters.dateRange,
          queryParams
        });
      }

      if (tab === 'my-tickets') {
        // Always show tickets created by the user in "My Tickets" tab
        // For instructors/admins, they can see assigned tickets in a separate view if needed
        queryParams.creatorId = userId;
      }

      const result = await TicketOperationsService.getTicketsPaginated(queryParams);

      // Sort tickets by created_at descending (newest first)
      const sortedTickets = (result.tickets || []).sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending: newest first
      });

      setTickets(sortedTickets);
      setFilteredTickets(sortedTickets);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Không thể tải tickets');
      setTickets([]);
      setFilteredTickets([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setIsLoadingTickets(false);
      fetchingRef.current = false;
    }
  }, [filters, pageSize, activeTab]);

  useEffect(() => {
    if (user?.id && !authLoading && isAuthenticated) {
      console.log('Dashboard: Fetching tickets', { userId: user.id, activeTab, filters });
      fetchTickets(user.id, 1, activeTab);
      setCurrentPage(1);
    }
  }, [user?.id, filters, activeTab, authLoading, isAuthenticated, fetchTickets]);

  useEffect(() => {
    let filtered = tickets;
    
    if (searchQuery.trim()) {
      filtered = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by created_at descending (newest first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descending: newest first
    });

    setFilteredTickets(sorted);
  }, [tickets, searchQuery]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleCreateTicket = useCallback(async (ticketData: any) => {
    try {
      await TicketOperationsService.createTicket(ticketData, user.id);
      toast.success('Tạo ticket thành công!');
      setShowCreateForm(false);
      if (user?.id) {
        await fetchTickets(user.id, currentPage, activeTab);
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(`Không thể tạo ticket: ${error.message}`);
    }
  }, [user?.id, fetchTickets, currentPage, activeTab]);

  const handleTicketClick = useCallback(async (ticketId: string) => {
    // Increment views and wait to avoid the request being aborted by navigation
    await ViewService.increment(ticketId);
    navigate(`/tickets/${ticketId}`);
  }, [navigate]);

  const handlePageChange = useCallback(async (page: number) => {
    setCurrentPage(page);
    if (user?.id) {
      await fetchTickets(user.id, page, activeTab);
    }
  }, [user?.id, fetchTickets, activeTab]);

  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (user?.id) {
      await fetchTickets(user.id, 1, tab);
    }
  }, [user?.id, fetchTickets]);

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
        {/* Tab Navigation */}
        <div className="col-span-full mb-4">
          <Tabs value={activeTab} onValueChange={isLoadingTickets ? undefined : handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger
                value="my-tickets"
                disabled={isLoadingTickets}
                className="flex items-center gap-2 text-sm"
              >
                <User className="h-4 w-4" />
                Ticket của tôi
              </TabsTrigger>
              <TabsTrigger
                value="all-tickets"
                disabled={isLoadingTickets}
                className="flex items-center gap-2 text-sm"
              >
                <Globe className="h-4 w-4" />
                Tất cả ticket
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Header Stats */}
        <div className="col-span-full mb-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg">
                  {activeTab === 'my-tickets' ? (
                    <User className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Globe className="h-5 w-5 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {activeTab === 'my-tickets'
                      ? 'Ticket của tôi'
                      : 'Tất cả ticket trong hệ thống'
                    }
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tổng cộng {totalCount} ticket • Trang {currentPage}/{totalPages}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Mở: {filteredTickets.filter(t => t.status === 'open').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Đang xử lý: {filteredTickets.filter(t => t.status === 'in_progress').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Đã giải quyết: {filteredTickets.filter(t => t.status === 'resolved').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Grid */}
        {isLoadingTickets ? (
          <div className="col-span-full text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Đang tải tickets...
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'my-tickets'
                  ? 'Đang tải tickets của bạn'
                  : 'Đang tải tất cả tickets'
                }
              </p>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'my-tickets' ? (
                  <User className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Globe className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {activeTab === 'my-tickets'
                  ? 'Chưa có ticket nào của bạn'
                  : 'Chưa có ticket nào trong hệ thống'
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'my-tickets'
                  ? 'Tạo ticket đầu tiên để bắt đầu sử dụng hệ thống'
                  : 'Hệ thống chưa có ticket nào. Hãy tạo ticket đầu tiên!'
                }
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tạo Ticket
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Ticket Cards */}
            <div className="col-span-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredTickets.map((ticket) => (
                  <FeedTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => handleTicketClick(ticket.id)}
                    onEdit={() => navigate(`/tickets/${ticket.id}?edit=true`)}
                    onDelete={() => {
                      console.log('Delete ticket:', ticket.id);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="col-span-full mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={async (size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                    if (user?.id) {
                      await fetchTickets(user.id, 1, activeTab, size);
                    }
                  }}
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