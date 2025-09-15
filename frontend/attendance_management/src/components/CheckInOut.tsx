import React, { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCcw,
  User,
  Settings,
} from "lucide-react";
import api from "@/utils/interceptor";

type UserRow = {
  user_id: number;
  full_name: string;
  email?: string;
  department?: string;
};
type ShiftRow = {
  shift_id: number;
  shift_name: string;
  start_time?: string | null;
  end_time?: string | null;
};
type TodayRecord = {
  attendance_id: number;
  user_id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  shift_id: number | null;
  work_hours: number | string | null;
  overtime_hours: number | string | null;
  full_name?: string;
  department?: string;
  email?: string;
  shift_name?: string;
};

const API_BASE = "http://localhost:80";

const toHHmm = (dt: string | null) => {
  if (!dt) return null;
  const parts = dt.split(" ");
  if (parts.length < 2) return null;
  const [hh, mm] = parts[1].split(":");
  return hh && mm ? `${hh}:${mm}` : null;
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const CheckInOut: React.FC = () => {
  // Dropdowns
  const [users, setUsers] = useState<UserRow[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");

  // State
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState<"checkin" | "checkout" | null>(null);
  const [todayRec, setTodayRec] = useState<TodayRecord | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Ref flags to prevent double API calls in dev
  const didLoadUsersRef = useRef(false);
  const didLoadShiftsRef = useRef(false);

  const checkedIn = !!todayRec?.check_in_time;
  const checkedOut = !!todayRec?.check_out_time;

  const selectedUser = useMemo(
    () => users.find((u) => String(u.user_id) === selectedUserId),
    [users, selectedUserId]
  );
  const selectedShift = useMemo(
    () => shifts.find((s) => String(s.shift_id) === selectedShiftId),
    [shifts, selectedShiftId]
  );

  // Load users
  const loadUsers = async () => {
    if (didLoadUsersRef.current) return;
    didLoadUsersRef.current = true;

    try {
      const res = await api(`${API_BASE}?action=users`);
      if (Array.isArray(res.data)) setUsers(res.data);
    } catch (e) {
      console.error("Failed to load users:", e);
    }
  };

  // Load shifts
  const loadShifts = async () => {
    if (didLoadShiftsRef.current) return;
    didLoadShiftsRef.current = true;

    try {
      const res = await api(`${API_BASE}?action=shifts`);
      if (Array.isArray(res.data)) setShifts(res.data);
    } catch (e) {
      console.error("Failed to load shifts:", e);
    }
  };

  // Load today's record for selected user
  const loadTodayRecord = async () => {
    if (!selectedUserId) {
      setTodayRec(null);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("date", todayISO());
      params.append("user_id", selectedUserId);

      const res = await api(
        `${API_BASE}?action=attendance&${params.toString()}`
      );
      const json = res.data;

      const list: TodayRecord[] = Array.isArray(json) ? json : [];
      const todays = list.filter(
        (r) => String(r.user_id) === selectedUserId && r.date === todayISO()
      );
      todays.sort((a, b) =>
        (a.check_in_time || "").localeCompare(b.check_in_time || "")
      );
      const latest = todays[todays.length - 1] || null;
      setTodayRec(latest);
    } catch (e) {
      console.error("Failed to load today record:", e);
      setTodayRec(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial loads (once)
  useEffect(() => {
    loadUsers();
    loadShifts();
  }, []);

  // Reload today record when user changes
  useEffect(() => {
    setMessage(null);
    loadTodayRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  // Check In
  const handleCheckIn = async () => {
    console.log(selectedUserId);

    if (!selectedUserId || !selectedShiftId) {
      setMessage(!selectedUserId ? "Select a user" : "Select a shift");
      return;
    }
    setPosting("checkin");
    setMessage(null);
    try {
      const body = {
        user_id: Number(selectedUserId),
        shift_id: Number(selectedShiftId),
      };
      const res = await api.post(`${API_BASE}?action=checkin`, body);
      const json = res.data;
      
      setMessage(json?.message || "Checked in");
      await loadTodayRecord();
    } catch (e) {
      console.error(e);
      setMessage("Check-in failed.");
    } finally {
      setPosting(null);
    }
  };

  // Check Out
  const handleCheckOut = async () => {
    if (!selectedUserId) return;
    setPosting("checkout");
    setMessage(null);
    try {
      const body = { user_id: Number(selectedUserId) };
      const res = await api.post(`${API_BASE}?action=checkout`,{ user_id: body.user_id});
      const json = res.data;
      setMessage(json?.message || "Checked out");
      await loadTodayRecord();
    } catch (e) {
      console.error(e);
      setMessage("Check-out failed.");
    } finally {
      setPosting(null);
    }
  };

  const getStatusBadge = () => {
    if (!selectedUserId) return null;
    if (loading) return <Badge className="bg-gray-500">Loading…</Badge>;
    if (!todayRec) return <Badge className="bg-gray-500">No record</Badge>;
    if (checkedOut) return <Badge className="bg-blue-600">Checked out</Badge>;
    if (checkedIn) return <Badge className="bg-green-600">Checked in</Badge>;
    return <Badge className="bg-gray-500">Not checked in</Badge>;
  };

  const checkInHHmm = toHHmm(todayRec?.check_in_time ?? null);
  const checkOutHHmm = toHHmm(todayRec?.check_out_time ?? null);
  const workH =
    todayRec?.work_hours != null ? Number(todayRec.work_hours) : null;
  const otH =
    todayRec?.overtime_hours != null ? Number(todayRec.overtime_hours) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Check In / Check Out
        </h1>
        <p className="text-muted-foreground">
          Select a user and shift, then record attendance.
        </p>
      </div>

      {/* Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User select */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Employee</div>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.user_id} value={String(u.user_id)}>
                    {u.full_name} {u.department ? `• ${u.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift select */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Shift</div>
            <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.shift_id} value={String(s.shift_id)}>
                    {s.shift_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={loadTodayRecord}
              disabled={!selectedUserId || loading || posting !== null}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={
                !selectedUserId ||
                !selectedShiftId ||
                posting !== null ||
                checkedIn
              }
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />{" "}
              {posting === "checkin" ? "Checking in…" : "Check In"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCheckOut}
              disabled={
                !selectedUserId || posting !== null || !checkedIn || checkedOut
              }
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />{" "}
              {posting === "checkout" ? "Checking out…" : "Check Out"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />{" "}
            {selectedUser?.full_name || "Current Status"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {todayRec?.status && (
              <span className="text-sm text-gray-600">
                Status: {todayRec.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Check In</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{checkInHHmm ?? "—"}</span>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Check Out</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{checkOutHHmm ?? "—"}</span>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Work / OT</div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">
                  {(workH ?? 0).toFixed(2)}h
                  {otH && otH > 0 ? ` • OT ${otH.toFixed(2)}h` : ""}
                </span>
              </div>
            </div>
          </div>

          {selectedShift && (
            <div className="text-sm text-gray-600">
              Shift: <b>{selectedShift.shift_name}</b>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-md border bg-gray-50 text-sm">
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInOut;
