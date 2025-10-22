'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FolderKanban, 
  Laptop, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalEmployees: number;
    totalProjects: number;
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
  };
  charts: {
    employeesByDepartment: Array<{ department: string; count: number }>;
    projectsByStatus: Array<{ status: string; count: number }>;
    assetsByCategory: Array<{ category: string; count: number }>;
  };
  recentActivities: Array<{
    type: string;
    description: string;
    created_at: string;
  }>;
  projectProgress: Array<{
    name: string;
    status: string;
    start_date: string;
    end_date: string;
    assigned_employees: number;
    timeline_status: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'on_hold': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimelineStatus = (timelineStatus: string) => {
    switch (timelineStatus) {
      case 'overdue': return { color: 'text-red-600', icon: AlertCircle };
      case 'due_soon': return { color: 'text-yellow-600', icon: Clock };
      default: return { color: 'text-green-600', icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your organization's resources and activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active employees in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                Projects in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.totalAssets || 0}</div>
              <p className="text-xs text-muted-foreground">
                IT assets in inventory
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Assets</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.availableAssets || 0}</div>
              <p className="text-xs text-muted-foreground">
                Assets ready for assignment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overview.assignedAssets || 0}</div>
              <p className="text-xs text-muted-foreground">
                Assets currently in use
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Latest project updates and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.projectProgress.slice(0, 5).map((project, index) => {
                const timelineInfo = getTimelineStatus(project.timeline_status || 'on_track');
                const Icon = timelineInfo.icon;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {project.assigned_employees} employees
                        </span>
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${timelineInfo.color}`} />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system activities and changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employees by Department */}
          <Card>
            <CardHeader>
              <CardTitle>Employees by Department</CardTitle>
              <CardDescription>Distribution across departments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.charts.employeesByDepartment.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{dept.department}</span>
                  <span className="text-sm font-medium text-foreground">{dept.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Projects by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
              <CardDescription>Current project status distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.charts.projectsByStatus.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{status.status.replace('_', ' ')}</span>
                  <span className="text-sm font-medium text-foreground">{status.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assets by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Assets by Category</CardTitle>
              <CardDescription>IT asset distribution by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.charts.assetsByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{category.category}</span>
                  <span className="text-sm font-medium text-foreground">{category.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
