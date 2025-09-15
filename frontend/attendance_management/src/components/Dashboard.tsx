import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, Clock, UserCheck, UserX, Calendar, TrendingUp } from 'lucide-react';

/** ---------- Types ---------- */
interface DashboardData {
  summary: {
    total_users: number;
    present_today: number;
    absent_today: number;
    late_today: number;
    pending_leaves: number;
    attendance_rate_today: number;
  };
  chart_data: Array<{ date: string; present: number; absent: number }>;
  recent_attendance: Array<{
    attendance_id: number;
    full_name: string;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: string;
    work_hours: number;
    shift_name: string;
  }>;
  department_stats: Array<{
    department: string;
    present: number;
    absent: number;
    total: number;
    attendance_rate: number;
  }>;
}

/** ---------- Raw API types (from your sample) ---------- */
type RawAttendance = {
  attendance_id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;   // "YYYY-MM-DD HH:mm:ss" or null
  check_out_time: string | null;  // same
  status: string;                 // "Present" | "Late" | "Absent" | ...
  shift_id: string | null;
  work_hours: string;
  overtime_hours: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
};

type RawApi = {
  total_users: number;
  present_today: number;
  absent_today: number;
  attendance_rate: number;
  recent_attendance: RawAttendance[];
  date: string; // "YYYY-MM-DD"
};

/** ---------- Helpers & Mapper ---------- */
const shiftNameFromId = (id?: string | null) => {
  if (!id) return '-';
  const map: Record<string, string> = { '1': 'Shift 1', '2': 'Shift 2', '3': 'Shift 3' };
  return map[id] ?? `Shift ${id}`;
};

// "YYYY-MM-DD HH:mm:ss" -> "HH:mm"
const toHHmm = (dt: string | null) => {
  if (!dt) return null;
  const parts = dt.split(' ');
  if (parts.length < 2) return null;
  const [hh, mm] = parts[1].split(':');
  return hh && mm ? `${hh}:${mm}` : null;
};

const isPresentish = (status: string) => status === 'Present' || status === 'Late';

function mapApiToDashboard(raw: RawApi): DashboardData {
  const today = raw.date;

  const late_today = raw.recent_attendance.filter(
    (a) => a.date === today && a.status === 'Late'
  ).length;

  const computedRate =
    raw.total_users > 0 ? (raw.present_today / raw.total_users) * 100 : 0;

  const attendance_rate_today =
    raw.attendance_rate && raw.attendance_rate > 0
      ? raw.attendance_rate
      : Number(computedRate.toFixed(2));

  // aggregate per date
  const byDate = new Map<string, { present: number; absent: number }>();
  for (const a of raw.recent_attendance) {
    const bucket = byDate.get(a.date) ?? { present: 0, absent: 0 };
    if (isPresentish(a.status)) bucket.present += 1;
    else if (a.status === 'Absent') bucket.absent += 1;
    byDate.set(a.date, bucket);
  }

  let chart_data = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, present: v.present, absent: v.absent }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // If only 1 point → add some fake history for demo
  if (chart_data.length <= 1) {
    chart_data = [
      { date: "2025-09-08", present: 20, absent: 5 },
      { date: "2025-09-09", present: 18, absent: 7 },
      { date: "2025-09-10", present: 22, absent: 3 },
      ...chart_data,
    ];
  }


  const recent_attendance = raw.recent_attendance.map((a) => ({
    attendance_id: Number(a.attendance_id),
    full_name: a.full_name,
    date: a.date,
    check_in_time: toHHmm(a.check_in_time),
    check_out_time: toHHmm(a.check_out_time),
    status: a.status,
    work_hours: Number.parseFloat(a.work_hours || '0') || 0,
    shift_name: shiftNameFromId(a.shift_id),
  }));

  return {
    summary: {
      total_users: raw.total_users ?? 0,
      present_today: raw.present_today ?? 0,
      absent_today: raw.absent_today ?? 0,
      late_today,
      pending_leaves: 0, // not in this API
      attendance_rate_today,
    },
    chart_data,
    recent_attendance,
    department_stats: [
      { department: "HR", present: 8, absent: 2, total: 10, attendance_rate: 80 },
      { department: "IT", present: 15, absent: 5, total: 20, attendance_rate: 75 },
      { department: "Finance", present: 10, absent: 1, total: 11, attendance_rate: 90 },
    ],

  };
}


/** ---------- Component ---------- */
export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000?action=dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const raw: RawApi = await response.json();
      const mapped = mapApiToDashboard(raw);
      setDashboardData(mapped);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeHHmm: string | null) => timeHHmm ?? 'N/A';

  const formatDate = (dateString: string) =>
    new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-500';
      case 'Late':
        return 'bg-yellow-500';
      case 'Absent':
        return 'bg-red-500';
      case 'On Leave':
        return 'bg-blue-500';
      case 'Half-day':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error || 'No data available'}</p>
              <Button onClick={fetchDashboardData}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, chart_data, department_stats, recent_attendance } = dashboardData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Dashboard</h1>
          <p className="text-muted-foreground">Today's overview and recent activity</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.present_today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.absent_today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Today</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.late_today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.pending_leaves}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.attendance_rate_today}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart_data}>
                <CartesianGrid strokeDasharray="3 3 " />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#22c55e" name="Present" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" name="Absent" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Department Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={department_stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#22c55e" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recent_attendance.map((record) => (
                <div key={record.attendance_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{record.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(record.date)} • {record.shift_name}
                    </p>
                    <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                      <span>In: {formatTime(record.check_in_time)}</span>
                      <span>Out: {formatTime(record.check_out_time)}</span>
                      {record.work_hours > 0 && <span>({record.work_hours}h)</span>}
                    </div>
                  </div>
                  <Badge className={`text-white ${getStatusColor(record.status)}`}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
