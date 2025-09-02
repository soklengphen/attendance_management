import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Calendar, Clock, User } from 'lucide-react';

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
  remarks: string | null;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
  total: number;
  limit: number;
  offset: number;
}

const AttendanceRecords: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`http://localhost:8000/api/attendance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      
      const data: AttendanceResponse = await response.json();
      setRecords(data.records);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, statusFilter, dateFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      params.append('limit', '1000'); // Get more records for export

      const response = await fetch(`http://localhost:8000/api/attendance?${params}`);
      const data: AttendanceResponse = await response.json();

      // Convert to CSV
      const headers = ['Name', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Work Hours', 'Overtime', 'Shift', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...data.records.map(record => [
          record.full_name,
          record.department,
          record.date,
          record.check_in_time || '',
          record.check_out_time || '',
          record.status,
          record.work_hours,
          record.overtime_hours,
          record.shift_name,
          record.remarks || ''
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-500 text-white';
      case 'Late': return 'bg-yellow-500 text-white';
      case 'Absent': return 'bg-red-500 text-white';
      case 'On Leave': return 'bg-blue-500 text-white';
      case 'Half-day': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const totalPages = Math.ceil(total / limit);

  const filteredRecords = records.filter(record =>
    record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground">
            View and manage all attendance records
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Half-day">Half-day</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full"
            />

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
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Hours</th>
                      <th className="text-left py-3 px-4 font-medium">Shift</th>
                      <th className="text-left py-3 px-4 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.attendance_id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium">{record.full_name}</div>
                            <div className="text-sm text-gray-500">{record.department}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">{formatDate(record.date)}</div>
                        </td>
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
                              <div className="text-orange-600">OT: {record.overtime_hours}h</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm">{record.shift_name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">
                            {record.remarks || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRecords.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No records found matching your criteria
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {Math.min((currentPage - 1) * limit + 1, total)} to{' '}
                    {Math.min(currentPage * limit, total)} of {total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
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