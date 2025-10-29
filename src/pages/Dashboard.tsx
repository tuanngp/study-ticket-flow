import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FeedLayout } from "@/components/FeedLayout";
import { FeedTicketCard } from "@/components/FeedTicketCard";
import { UnifiedTicketCreation } from "@/components/UnifiedTicketCreation";
import { Pagination } from "@/components/Pagination";
import { TicketOperationsService, Ticket } from "@/services/ticketOperationsService";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Globe, Plus } from "lucide-react";

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTickets = useCallback(async (userId: string, page: number = currentPage, tab: string = activeTab) => {
    if (isLoadingTickets) return;

    try {
      setIsLoadingTickets(true);

      let queryParams: any = {
        page,
        limit: pageSize,
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        courseCode: filters.dateRange !== 'all' ? filters.dateRange : undefined,
        includeGroupTickets: true, // Include all tickets including group tickets
        includeDeleted: true, // Include all tickets including deleted ones
      };

      if (tab === 'my-tickets') {
        if (profile?.role === 'instructor' || profile?.role === 'admin') {
          queryParams.assigneeId = userId;
        } else {
          queryParams.creatorId = userId;
        }
      }

      const result = await TicketOperationsService.getTicketsPaginated(queryParams);

      // Debug logging
      console.log('Dashboard fetchTickets:', {
        userId,
        userRole: user?.role,
        profileRole: profile?.role,
        tab,
        queryParams,
        resultCount: result.tickets.length,
        tickets: result.tickets
      });

      setTickets(result.tickets);
      setFilteredTickets(result.tickets);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Không thể tải tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [user?.role, filters, pageSize, isLoadingTickets, currentPage, activeTab]);

  useEffect(() => {
    if (user?.id) {
      fetchTickets(user.id, 1, activeTab);
      setCurrentPage(1);
    }
  }, [user?.id, filters, activeTab]); // Add user?.id to dependencies

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
  }, [authLoading, isAuthenticated, navigate]);

  const handleCreateTicket = useCallback(async (ticketData: any) => {
    try {
      await TicketOperationsService.createTicket(ticketData, user.id);
      toast.success('Tạo ticket thành công!');
      setShowCreateForm(false);
      if (user?.id) {
        await fetchTickets(user.id, currentPage, activeTab);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(`Không thể tạo ticket: ${error.message}`);
    }
  }, [user?.id, fetchTickets, currentPage, activeTab]);

  const handleTicketClick = useCallback((ticketId: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <FeedLayout
        onCreateTicket={() => setShowCreateForm(true)}
        user={user}
        profile={profile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
      >
        {/* Compact Tab Navigation */}
        <div className="col-span-full mb-4">
          <Tabs value={activeTab} onValueChange={isLoadingTickets ? undefined : handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm">
              <TabsTrigger
                value="my-tickets"
                disabled={isLoadingTickets}
                className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <User className="h-4 w-4" />
                Ticket của tôi
              </TabsTrigger>
              <TabsTrigger
                value="all-tickets"
                disabled={isLoadingTickets}
                className="flex items-center gap-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Globe className="h-4 w-4" />
                Tất cả ticket
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Compact Header Stats */}
        <div className="col-span-full mb-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  {activeTab === 'my-tickets' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Globe className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeTab === 'my-tickets'
                      ? (user?.role === 'instructor' || user?.role === 'admin'
                        ? 'Ticket được gán cho tôi'
                        : 'Ticket của tôi')
                      : 'Tất cả ticket trong hệ thống'
                    }
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tổng cộng {totalCount} ticket • Trang {currentPage}/{totalPages}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
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

        {/* Compact Ticket Grid */}
        {isLoadingTickets ? (
          <div className="col-span-full text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Đang tải tickets...
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {activeTab === 'my-tickets'
                  ? (user?.role === 'instructor' || user?.role === 'admin'
                    ? 'Đang tải tickets được gán cho bạn'
                    : 'Đang tải tickets của bạn')
                  : 'Đang tải tất cả tickets'
                }
              </p>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'my-tickets' ? (
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Globe className="h-8 w-8 text-green-600 dark:text-green-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {activeTab === 'my-tickets'
                  ? (user?.role === 'instructor' || user?.role === 'admin'
                    ? 'Chưa có ticket nào được gán cho bạn'
                    : 'Chưa có ticket nào của bạn')
                  : 'Chưa có ticket nào trong hệ thống'
                }
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {activeTab === 'my-tickets'
                  ? (user?.role === 'instructor' || user?.role === 'admin'
                    ? 'Sinh viên sẽ gán ticket cho bạn khi cần hỗ trợ'
                    : 'Tạo ticket đầu tiên để bắt đầu sử dụng hệ thống')
                  : 'Hệ thống chưa có ticket nào. Hãy tạo ticket đầu tiên!'
                }
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2 mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {activeTab === 'my-tickets' && (user?.role === 'instructor' || user?.role === 'admin')
                  ? 'Tạo Ticket Mới'
                  : 'Tạo Ticket'
                }
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Compact Ticket Cards - 4 columns on large screens */}
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

            {/* Compact Pagination */}
            {totalPages > 1 && (
              <div className="col-span-full mt-8 flex justify-center">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={() => { }} // Disabled for compact view
                    hasNextPage={currentPage < totalPages}
                    hasPreviousPage={currentPage > 1}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </FeedLayout>
    </div>
  );
};

export default Dashboard;