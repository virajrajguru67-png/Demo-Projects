"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Calendar,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface TicketData {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category_name: string;
  category_color: string;
  priority_name: string;
  priority_level: number;
  priority_color: string;
  status_name: string;
  status_color: string;
  status_is_final: boolean;
  requester_name: string;
  requester_email: string;
  assignee_name?: string;
  assignee_email?: string;
  team_name?: string;
  department_name?: string;
  sla_due_date: string;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

interface TicketMeta {
  categories: Array<{ id: number; name: string; color: string }>;
  priorities: Array<{ id: number; name: string; level: number; color: string }>;
  statuses: Array<{ id: number; name: string; color: string }>;
  teams: Array<{ id: number; name: string }>;
}

interface TicketStats {
  total: number;
  open: number;
  overdue: number;
  statusStats: Array<{
    status_name: string;
    status_color: string;
    count: number;
  }>;
  priorityStats: Array<{
    priority_name: string;
    priority_color: string;
    count: number;
  }>;
  categoryStats: Array<{
    category_name: string;
    category_color: string;
    count: number;
  }>;
  avgResolutionHours: number;
}

export default function TicketsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [meta, setMeta] = useState<TicketMeta>({
    categories: [],
    priorities: [],
    statuses: [],
    teams: [],
  });
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch tickets data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Don't fetch if no token

      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        // Fetch tickets
        const ticketsResponse = await fetch(
          `${apiUrl}/api/tickets?${new URLSearchParams({
            search: searchTerm,
            status: filterStatus !== "all" ? filterStatus : "",
            priority: filterPriority !== "all" ? filterPriority : "",
            category: filterCategory !== "all" ? filterCategory : "",
            assignee: filterAssignee !== "all" ? filterAssignee : "",
          })}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          setTickets(ticketsData.tickets || []);
        }

        // Fetch metadata
        const [categoriesRes, prioritiesRes, statusesRes, teamsRes] =
          await Promise.all([
            fetch(`${apiUrl}/api/tickets/meta/categories`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${apiUrl}/api/tickets/meta/priorities`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${apiUrl}/api/tickets/meta/statuses`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch(`${apiUrl}/api/tickets/meta/teams`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        const [categories, priorities, statuses, teams] = await Promise.all([
          categoriesRes.json(),
          prioritiesRes.json(),
          statusesRes.json(),
          teamsRes.json(),
        ]);

        setMeta({
          categories: categories || [],
          priorities: priorities || [],
          statuses: statuses || [],
          teams: teams || [],
        });

        // Fetch stats
        const statsResponse = await fetch(
          `${apiUrl}/api/tickets/stats/overview`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load ticket data");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchData();
    }
  }, [
    user,
    token,
    searchTerm,
    filterStatus,
    filterPriority,
    filterCategory,
    filterAssignee,
  ]);

  const getPriorityBadge = (priority: string, color: string) => {
    return (
      <Badge className="text-white" style={{ backgroundColor: color }}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string, color: string) => {
    return (
      <Badge className="text-white" style={{ backgroundColor: color }}>
        {status}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string, color: string) => {
    return (
      <Badge variant="outline" style={{ borderColor: color, color: color }}>
        {category}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewTicket = (ticket: TicketData) => {
    setSelectedTicket(ticket);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">
            {authLoading ? "Authenticating..." : "Loading tickets..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ticket Management
              </h1>
              <p className="text-gray-600">Manage and track support tickets</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Ticket</DialogTitle>
                    <DialogDescription>
                      Submit a new support ticket for assistance.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateTicketForm
                    meta={meta}
                    onSuccess={() => {
                      setShowCreateDialog(false);
                      // Refresh tickets
                      window.location.reload();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Tickets
                </CardTitle>
                <Ticket className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
                <p className="text-xs text-gray-500">
                  {stats.open} open tickets
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Open Tickets
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.open}
                </div>
                <p className="text-xs text-gray-500">{stats.overdue} overdue</p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Overdue Tickets
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </div>
                <p className="text-xs text-gray-500">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Resolution
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(stats.avgResolutionHours)}h
                </div>
                <p className="text-xs text-gray-500">Average resolution time</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Search & Filter Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="status"
                  className="text-sm font-medium text-gray-700"
                >
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {meta.statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="priority"
                  className="text-sm font-medium text-gray-700"
                >
                  Priority
                </Label>
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {meta.priorities.map((priority) => (
                      <SelectItem
                        key={priority.id}
                        value={priority.id.toString()}
                      >
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Category
                </Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {meta.categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setFilterCategory("all");
                    setFilterAssignee("all");
                  }}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Tickets ({tickets.length})
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Complete list of all support tickets
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-sm font-medium text-gray-700">
                      Ticket #
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Title
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Category
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Priority
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Requester
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Assignee
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Created
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      SLA
                    </TableHead>
                    <TableHead className="text-sm font-medium text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <TableCell className="font-mono text-sm">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {ticket.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(
                          ticket.category_name,
                          ticket.category_color
                        )}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(
                          ticket.priority_name,
                          ticket.priority_color
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(
                          ticket.status_name,
                          ticket.status_color
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {ticket.requester_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.requester_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.assignee_name ? (
                          <div>
                            <div className="font-medium text-sm">
                              {ticket.assignee_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ticket.assignee_email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(ticket.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {ticket.is_overdue ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span
                            className={`text-sm ${
                              ticket.is_overdue
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {formatDate(ticket.sla_due_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {tickets.length === 0 && (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No tickets found matching your criteria
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

// Create Ticket Form Component
function CreateTicketForm({
  meta,
  onSuccess,
}: {
  meta: TicketMeta;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    priority_id: "",
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          priority_id: parseInt(formData.priority_id),
        }),
      });

      if (response.ok) {
        toast.success("Ticket created successfully!");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of the issue"
          required
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-700"
        >
          Description *
        </Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Detailed description of the issue"
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="category"
            className="text-sm font-medium text-gray-700"
          >
            Category *
          </Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) =>
              setFormData({ ...formData, category_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {meta.categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="priority"
            className="text-sm font-medium text-gray-700"
          >
            Priority *
          </Label>
          <Select
            value={formData.priority_id}
            onValueChange={(value) =>
              setFormData({ ...formData, priority_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {meta.priorities.map((priority) => (
                <SelectItem key={priority.id} value={priority.id.toString()}>
                  {priority.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}

// Ticket Detail Modal Component
function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: TicketData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {ticket.ticket_number} - {ticket.title}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Created by {ticket.requester_name} on{" "}
                {new Date(ticket.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Ticket Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                <div className="mt-1">
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: ticket.status_color }}
                  >
                    {ticket.status_name}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Priority
                </Label>
                <div className="mt-1">
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: ticket.priority_color }}
                  >
                    {ticket.priority_name}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: ticket.category_color,
                      color: ticket.category_color,
                    }}
                  >
                    {ticket.category_name}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Requester
                </Label>
                <div className="mt-1">
                  <p className="font-medium">{ticket.requester_name}</p>
                  <p className="text-sm text-gray-500">
                    {ticket.requester_email}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Assignee
                </Label>
                <div className="mt-1">
                  {ticket.assignee_name ? (
                    <>
                      <p className="font-medium">{ticket.assignee_name}</p>
                      <p className="text-sm text-gray-500">
                        {ticket.assignee_email}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400">Unassigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* SLA Info */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                SLA Information
              </Label>
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">
                    {new Date(ticket.sla_due_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p
                    className={`font-medium ${
                      ticket.is_overdue ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {ticket.is_overdue ? "Overdue" : "On Track"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
