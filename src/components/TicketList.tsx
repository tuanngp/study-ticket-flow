import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { Clock, User, Brain, BookOpen, Users, AlertCircle, CheckCircle, Filter, Search, X, Star, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TicketOperationsService, Ticket, PaginatedTickets } from "@/services/ticketOperationsService";
import { ReviewSummary } from "./ReviewButton";
import { Pagination } from "./Pagination";

interface TicketListProps {
  userId: string;
}

interface FilterOptions {
  status: string;
  priority: string;
  type: string;
  courseCode: string;
  search: string;
}

export const TicketList = ({ userId }: TicketListProps) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    type: 'all',
    courseCode: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginatedTickets>({
    tickets: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDeleteTicket = async (ticketId: string) => {
    setDeletingTicketId(ticketId);
    try {
      const { success, error } = await TicketOperationsService.deleteTicket(ticketId, userId);

      if (!success) {
        toast.error(error || "Failed to delete ticket");
        return;
      }

      toast.success("Ticket deleted successfully");
      // Refresh the ticket list with current pagination
      const queryOptions: any = {
        page: currentPage,
        limit: pageSize
      };

      // Only add filters that are not 'all'
      if (filters.status && filters.status !== 'all') {
        queryOptions.status = filters.status;
      }
      if (filters.priority && filters.priority !== 'all') {
        queryOptions.priority = filters.priority;
      }
      if (filters.type && filters.type !== 'all') {
        queryOptions.type = filters.type;
      }
      if (filters.courseCode && filters.courseCode !== 'all') {
        queryOptions.courseCode = filters.courseCode;
      }

      const paginatedData = await TicketOperationsService.getTicketsPaginated(queryOptions);
      setPagination(paginatedData);
      setTickets(paginatedData.tickets);
      setFilteredTickets(paginatedData.tickets);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete ticket");
    } finally {
      setDeletingTicketId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const canEditTicket = (ticket: Ticket) => {
    return ticket.creator_id === userId || ticket.assignee_id === userId;
  };

  const canDeleteTicket = (ticket: Ticket) => {
    return ticket.creator_id === userId && 
           ticket.status !== 'resolved' && 
           ticket.status !== 'closed' && 
           ticket.status !== 'deleted';
  };

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        // Build query options from filters
        const queryOptions: any = {
          page: currentPage,
          limit: pageSize
        };

        // Only add filters that are not 'all'
        if (filters.status && filters.status !== 'all') {
          queryOptions.status = filters.status;
        }
        if (filters.priority && filters.priority !== 'all') {
          queryOptions.priority = filters.priority;
        }
        if (filters.type && filters.type !== 'all') {
          queryOptions.type = filters.type;
        }
        if (filters.courseCode && filters.courseCode !== 'all') {
          queryOptions.courseCode = filters.courseCode;
        }

        const paginatedData = await TicketOperationsService.getTicketsPaginated(queryOptions);
        setPagination(paginatedData);
        setTickets(paginatedData.tickets);
        setFilteredTickets(paginatedData.tickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();

    // Subscribe to ticket changes
    const unsubscribe = TicketOperationsService.subscribeToTickets(fetchTickets);

    return unsubscribe;
  }, [userId, currentPage, pageSize, filters]);

  // Apply search filter (client-side only for search)
  useEffect(() => {
    let filtered = [...tickets];

    // Search filter (client-side only)
    if (filters.search) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  }, [tickets, filters.search]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      type: 'all',
      courseCode: 'all',
      search: ''
    });
  };

  const getUniqueCourseCodes = () => {
    const courseCodes = tickets
      .map(ticket => (ticket as any).courseCode)
      .filter(Boolean)
      .filter((code, index, arr) => arr.indexOf(code) === index);
    return courseCodes;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-warning/10 text-warning border-warning/20",
      in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      resolved: "bg-success/10 text-success border-success/20",
      closed: "bg-muted text-muted-foreground border-muted",
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No tickets found. Create your first ticket to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              <Badge variant="outline" className="text-xs">
                {filteredTickets.length} of {tickets.length} tickets
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={Object.values(filters).every(v => v === 'all' || v === '')}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Course Code Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Course</label>
                <Select value={filters.courseCode} onValueChange={(value) => handleFilterChange('courseCode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {getUniqueCourseCodes().map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tickets match your current filters.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-2">
            Clear Filters
          </Button>
        </div>
      ) : (
        filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className="hover:shadow-md transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <CardTitle className="text-lg mb-2 line-clamp-1">
                    {ticket.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {ticket.description}
                  </p>
                  
                  {/* Educational Context */}
                  {(ticket as any).courseCode && (
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <Badge variant="outline" className="text-xs">
                        {(ticket as any).courseCode}
                      </Badge>
                      {(ticket as any).className && (
                        <Badge variant="outline" className="text-xs">
                          {(ticket as any).className}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {ticket.ai_suggested_priority && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <Badge variant="secondary" className="text-xs">
                        AI Suggested: {ticket.ai_suggested_priority}
                      </Badge>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.creator?.full_name || ticket.creator?.email}
                    </div>
                    <span>•</span>
                    <ReviewSummary ticketId={ticket.id} />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-2">
                    {canEditTicket(ticket) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tickets/${ticket.id}?edit=true`);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteTicket(ticket) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Ticket</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete "{ticket.title}"? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline">
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDeleteTicket(ticket.id)}
                              disabled={deletingTicketId === ticket.id}
                            >
                              {deletingTicketId === ticket.id ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {ticket.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalCount > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
          />
        </div>
      )}
    </div>
  );
};
