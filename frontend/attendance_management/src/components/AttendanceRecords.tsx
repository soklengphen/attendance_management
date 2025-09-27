import React, { useState, useEffect } from "react";
import api from "../utils/interceptor"; // Axios instance with JWT interceptor
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Calendar, Clock, User } from "lucide-react";

interface AttendanceRecord {
  attendance_id: number;
  user_id: number;
  full_name: string;
  department: string;
  email: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  shift_name: string;
  work_hours: number;
  overtime_hours: number;
  leave_type: string;
  remarks: string | null;
}

interface AttendanceResponse {
  records: any[];
  total: number;
  limit: number;
  offset: number;
}

type RawAttendance = {
  attendance_id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  shift_id?: string | null;
  work_hours: string;
  overtime_hours: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  department: string;
  email: string;
  leave_type: string;
  shift_name?: string;
};

// ---- helpers ----
const toHHmm = (dt: string | null): string | null => {
  if (!dt) return null;
  const parts = dt.split(" ");
  if (parts.length < 2) return null;
  const [hh, mm] = parts[1].split(":");
  return hh && mm ? `${hh}:${mm}` : null;
};

const mapRaw = (r: RawAttendance): AttendanceRecord => ({
  attendance_id: Number(r.attendance_id),
  user_id: Number(r.user_id),
  full_name: r.full_name,
  department: r.department,
  email: r.email,
  date: r.date,
  check_in_time: toHHmm(r.check_in_time),
  check_out_time: toHHmm(r.check_out_time),
  status: r.status,
  shift_name: r.shift_name ?? "Shift 1",
  work_hours: Number.parseFloat(r.work_hours || "0") || 0,
  overtime_hours: Number.parseFloat(r.overtime_hours || "0") || 0,
  leave_type: r.leave_type,
  remarks: r.remarks,
});

const AttendanceRecords: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Present" | "Late" | "Absent" | "On Leave" | "Half-day"
  >("all");
  const [dateFilter, setDateFilter] = useState("");

  // --- Fetch Records ---
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const params: Record<string, any> = { limit, offset };
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get("/?action=attendance", { params });
      const json = response.data;

      let mapped: AttendanceRecord[] = [];
      let totalCount = 0;

      if (Array.isArray(json)) {
        mapped = json.map(mapRaw);
        totalCount = mapped.length;
      } else {
        const data = json as AttendanceResponse;
        const list = Array.isArray(data.records) ? data.records : [];
        mapped = list.map(mapRaw);
        totalCount =
          typeof data.total === "number" ? data.total : mapped.length;
      }

      setRecords(mapped);
      setTotal(totalCount);
    } catch (error) {
      console.error("Error fetching records:", error);
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, dateFilter, searchTerm]);

  const handleSearch = () => setCurrentPage(1);

  const filteredRecords = records.filter(
    (record) =>
      record.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    // record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // record.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit) || 1;

  // --- Export CSV ---
  const handleExport = async () => {
    try {
      const headers = [
        "Name",
        "Department",
        "Date",
        "Check In",
        "Check Out",
        "Status",
        "Work Hours",
        "Overtime",
        "Shift",
        "Leave_Type",
        "Remarks",
      ];
      const csvContent = [
        headers.join(","),
        ...filteredRecords.map((record) =>
          [
            record.full_name,
            record.department || "--/--",
            record.date,
            record.check_in_time || "--/--",
            record.check_out_time || "--/--",
            record.status,
            record.work_hours,
            record.overtime_hours,
            record.shift_name,
            record.leave_type || "--/--",
            record.remarks || "--/--",
          ]
            .map((v) => {
              const s = String(v);
              return s.includes(",") || s.includes('"') || s.includes("\n")
                ? `"${s.replace(/"/g, '""')}"`
                : s;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_records_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const formatTime = (timeString: string | null) => timeString ?? "N/A";

  const formatDate = (dateString: string) =>
    new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-500 text-white";
      case "Late":
        return "bg-yellow-500 text-white";
      case "Absent":
        return "bg-red-500 text-white";
      case "On Leave":
        return "bg-blue-500 text-white";
      case "Half-day":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getLeaveTypeBadge = (leaveType?: string) => {
    // ✅ Handle no status case
    if (!leaveType) {
      return (
        <span className="px-2 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-800">
          --/--
        </span>
      );
    }

    let colorClass = "bg-gray-200 text-gray-800"; // default

    switch (leaveType) {
      case "Sick":
        colorClass = "bg-red-100 text-red-800";
        break;
      case "Annual":
        colorClass = "bg-green-100 text-green-800";
        break;
      case "Unpaid":
        colorClass = "bg-yellow-100 text-yellow-800";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-md text-sm font-medium ${colorClass}`}
      >
        {leaveType}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Records
          </h1>
          <p className="text-muted-foreground">
            View and manage all attendance records
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as any);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Half-day">Half-day</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-55 pr-3 appearance-none 
                [&::-webkit-calendar-picker-indicator]:opacity-0 
                [&::-webkit-calendar-picker-indicator]:absolute 
                [&::-webkit-calendar-picker-indicator]:w-full 
                [&::-webkit-calendar-picker-indicator]:h-full 
                [&::-webkit-calendar-picker-indicator]:cursor-pointer
                text-center"
              />
              <Calendar className="absolute right-15 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            <Button onClick={handleSearch} className="w-full">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Records ({total} total)</CardTitle>
            <Button onClick={fetchRecords} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Employee
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Times
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      <th className="text-left py-3 px-4 font-medium">Shift</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Leave Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.attendance_id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium">
                              {record.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.department}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{formatDate(record.date)}</td>
                        <td className="py-4 px-4">
                          <div className="text-sm space-y-1">
                            <div>In: {formatTime(record.check_in_time)}</div>
                            <div>Out: {formatTime(record.check_out_time)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm space-y-1">
                            <div>Work: {record.work_hours}h</div>
                            {record.overtime_hours > 0 && (
                              <div className="text-orange-600">
                                OT: {record.overtime_hours}h
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">{record.shift_name}</td>
                        <td className="py-4 px-4">
                          {getLeaveTypeBadge(record.leave_type)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {record.remarks || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {records.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No records found matching your criteria
                  </div>
                )}
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} • {total} total
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage >= totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceRecords;
