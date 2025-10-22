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
  Users,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit,
  Eye,
  Search,
  Filter,
  Download,
  Plus,
  UserCheck,
  Clock,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department_id: number;
  department_name: string;
  hire_date: string;
  salary: number;
  status: "active" | "inactive" | "on_leave";
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
}

export default function EmployeeDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch employees data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        // Fetch employees
        const employeesResponse = await fetch(`${apiUrl}/api/employees`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData.employees || []);
        }

        // Fetch departments
        const departmentsResponse = await fetch(`${apiUrl}/api/departments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartments(departmentsData.departments || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load employee data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      !filterDepartment ||
      filterDepartment === "all" ||
      employee.department_id.toString() === filterDepartment;
    const matchesStatus =
      !filterStatus ||
      filterStatus === "all" ||
      employee.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleEditEmployee = (employee: Employee) => {
    // TODO: Implement edit functionality
    toast.info("Edit functionality coming soon!");
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/employees/${employeeId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          setEmployees(employees.filter((emp) => emp.id !== employeeId));
          toast.success("Employee deleted successfully");
        } else {
          toast.error("Failed to delete employee");
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("Failed to delete employee");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case "on_leave":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">On Leave</Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">
            {authLoading ? "Authenticating..." : "Loading employee data..."}
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render anything (redirect will happen)
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
                Employee Dashboard
              </h1>
              <p className="text-gray-600">
                Manage and view all employee records
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {employees.length}
              </div>
              <p className="text-xs text-gray-500">
                {employees.filter((emp) => emp.status === "active").length}{" "}
                active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Departments
              </CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {departments.length}
              </div>
              <p className="text-xs text-gray-500">Active departments</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                On Leave
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {employees.filter((emp) => emp.status === "on_leave").length}
              </div>
              <p className="text-xs text-gray-500">Currently on leave</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                New This Month
              </CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {
                  employees.filter((emp) => {
                    const hireDate = new Date(emp.hire_date);
                    const now = new Date();
                    return (
                      hireDate.getMonth() === now.getMonth() &&
                      hireDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </div>
              <p className="text-xs text-gray-500">Recently hired</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Search & Filter Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="department"
                  className="text-sm font-medium text-gray-700"
                >
                  Department
                </Label>
                <Select
                  value={filterDepartment}
                  onValueChange={setFilterDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterDepartment("all");
                    setFilterStatus("all");
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

        {/* Employees Table */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Employees ({filteredEmployees.length})
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Complete list of all employees in the system
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Employee
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Position
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Department
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Hire Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Salary
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {employee.first_name[0]}
                              {employee.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">{employee.position}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {employee.department_name}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          {formatDate(employee.hire_date)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">
                          {formatCurrency(employee.salary)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEmployee(employee)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No employees found matching your criteria
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Employee Details
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmployee(null)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">
                    Personal Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-gray-500">Full Name</Label>
                      <p className="font-medium text-gray-900">
                        {selectedEmployee.first_name}{" "}
                        {selectedEmployee.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <p className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {selectedEmployee.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Phone</Label>
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {selectedEmployee.phone}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Address</Label>
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {selectedEmployee.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">
                    Work Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-gray-500">Position</Label>
                      <p className="font-medium">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">
                        Department
                      </Label>
                      <p className="font-medium">
                        {selectedEmployee.department_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Hire Date</Label>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(selectedEmployee.hire_date)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Salary</Label>
                      <p className="font-medium">
                        {formatCurrency(selectedEmployee.salary)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedEmployee.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-2 text-gray-900">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">
                        Contact Name
                      </Label>
                      <p className="font-medium">
                        {selectedEmployee.emergency_contact}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">
                        Contact Phone
                      </Label>
                      <p className="font-medium">
                        {selectedEmployee.emergency_phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
