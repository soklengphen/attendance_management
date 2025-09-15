import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import ProtectedRoute from "./utils/protectedRoute";

import { Dashboard } from "./components/Dashboard";
import CheckInOut from "./components/CheckInOut";
import AttendanceRecords from "./components/AttendanceRecords";
import UserManagement from "./components/UserManagement";
import { Login } from "./components/Login";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Clock, Users, Calendar, Menu, X } from "lucide-react";

type NavItem = {
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
  description: string;
  roles: string[];
};

const isLogin = localStorage.getItem("auth") === "true" ? true : false;

// ---------------- Navigation ----------------
const navigation: NavItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and analytics",
    roles: ["admin", "teacher"],
  },
  {
    id: "checkin",
    name: "Check In/Out",
    path: "/checkin",
    icon: Clock,
    description: "Record attendance",
    roles: ["admin", "teacher", "employee"],
  },
  {
    id: "records",
    name: "Attendance Records",
    path: "/records",
    icon: Calendar,
    description: "View all records",
    roles: ["admin", "teacher", "employee"],
  },
  {
    id: "users",
    name: "User Management",
    path: "/users",
    icon: Users,
    description: "Manage employees",
    roles: ["admin"],
  },
];

// ---------------- Sidebar ----------------
const Sidebar: React.FC<{
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  // Example: read user role from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "User"; // default fallback

  return (
    <div
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500">Management System</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation
            .filter((item) => item.roles.includes(role)) // ✅ filter by role
            .map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon
                    className={`h-5 w-5 mr-3 ${
                      isActive ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  System Status
                </div>
                <div className="flex items-center justify-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ---------------- Layout for main routes ----------------
const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "employee";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {navigation.find((nav) => nav.path === location.pathname)?.name ||
                "Dashboard"}
            </h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checkin" element={<CheckInOut />} />
            <Route path="/records" element={<AttendanceRecords />} />
            <Route
              path="/users"
              element={
                role === "admin" ? (
                  <UserManagement />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ---------------- App ----------------
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
