'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Users, FolderKanban, Laptop, BarChart3 } from 'lucide-react';

interface ReportData {
  employees: {
    total: number;
    byDepartment: Array<{ department: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  projects: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
  };
  assets: {
    total: number;
    byCategory: Array<{ category: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch dashboard stats as base data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the data for reports
        setReportData({
          employees: {
            total: data.overview.totalEmployees,
            byDepartment: data.charts.employeesByDepartment,
            byStatus: [] // Would need additional API call
          },
          projects: {
            total: data.overview.totalProjects,
            byStatus: data.charts.projectsByStatus,
            byPriority: [] // Would need additional API call
          },
          assets: {
            total: data.overview.totalAssets,
            byCategory: data.charts.assetsByCategory,
            byStatus: [] // Would need additional API call
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="mt-2 text-muted-foreground">Generate and export organizational reports</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData?.employees.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active employees in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData?.projects.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active projects in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData?.assets.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                IT assets in inventory
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Employee Reports
              </CardTitle>
              <CardDescription>
                Generate reports about your workforce
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">By Department</h4>
                {reportData?.employees.byDepartment.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{dept.department}</span>
                    <span className="text-sm font-medium">{dept.count}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => reportData?.employees.byDepartment && exportToCSV(reportData.employees.byDepartment, 'employees-by-department.csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Department Report
              </Button>
            </CardContent>
          </Card>

          {/* Project Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderKanban className="h-5 w-5 mr-2" />
                Project Reports
              </CardTitle>
              <CardDescription>
                Generate reports about project status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">By Status</h4>
                {reportData?.projects.byStatus.map((status, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{status.status.replace('_', ' ')}</span>
                    <span className="text-sm font-medium">{status.count}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => reportData?.projects.byStatus && exportToCSV(reportData.projects.byStatus, 'projects-by-status.csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Project Report
              </Button>
            </CardContent>
          </Card>

          {/* Asset Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Laptop className="h-5 w-5 mr-2" />
                Asset Reports
              </CardTitle>
              <CardDescription>
                Generate reports about IT assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">By Category</h4>
                {reportData?.assets.byCategory.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{category.category}</span>
                    <span className="text-sm font-medium">{category.count}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => reportData?.assets.byCategory && exportToCSV(reportData.assets.byCategory, 'assets-by-category.csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Asset Report
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </CardTitle>
              <CardDescription>
                View system analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Advanced analytics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
