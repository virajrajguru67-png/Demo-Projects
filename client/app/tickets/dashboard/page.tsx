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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Ticket,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

interface TrendData {
  date: string;
  created: number;
  resolved: number;
  open: number;
}

export default function TicketDashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Don't fetch if no token

      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        // Fetch stats
        const statsResponse = await fetch(
          `${apiUrl}/api/tickets/stats/overview?period=${period}`,
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

        // Fetch trend data (mock data for now)
        const mockTrendData: TrendData[] = [];
        const days = parseInt(period);
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockTrendData.push({
            date: date.toISOString().split("T")[0],
            created: Math.floor(Math.random() * 10) + 1,
            resolved: Math.floor(Math.random() * 8) + 1,
            open: Math.floor(Math.random() * 15) + 5,
          });
        }
        setTrendData(mockTrendData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchData();
    }
  }, [user, token, period]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">
            {authLoading ? "Authenticating..." : "Loading dashboard..."}
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
                Ticket Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                Comprehensive analytics and insights for ticket management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
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
                  {stats.open} currently open
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Resolution Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total > 0
                    ? Math.round(
                        ((stats.total - stats.open) / stats.total) * 100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-500">Tickets resolved</p>
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
                  Avg Resolution Time
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-400" />
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Ticket Trends
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ticket creation and resolution over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Resolved"
                    />
                    <Line
                      type="monotone"
                      dataKey="open"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Open"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Status Distribution
              </CardTitle>
              <CardDescription className="text-gray-600">
                Current ticket status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.statusStats || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.statusStats || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.status_color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Distribution */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Priority Distribution
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tickets by priority level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.priorityStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Category Distribution
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tickets by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.categoryStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Performance Metrics
              </CardTitle>
              <CardDescription className="text-gray-600">
                Key performance indicators for ticket management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats?.total > 0
                      ? Math.round(
                          ((stats.total - stats.open) / stats.total) * 100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Resolution Rate</div>
                  <div className="flex items-center justify-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">
                      +5.2% from last month
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(stats?.avgResolutionHours || 0)}h
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Resolution Time
                  </div>
                  <div className="flex items-center justify-center mt-1">
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">
                      -2.1h from last month
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {stats?.overdue || 0}
                  </div>
                  <div className="text-sm text-gray-600">Overdue Tickets</div>
                  <div className="flex items-center justify-center mt-1">
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">
                      -3 from last week
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
