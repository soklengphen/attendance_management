import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface User {
  user_id: number;
  full_name: string;
  department: string;
}

interface Shift {
  shift_id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
}


const AttendancePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch users
  useEffect(() => {
    fetch("http://localhost:8000?action=users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // ✅ Fetch shifts
  useEffect(() => {
    fetch("http://localhost:8000?action=shifts")
      .then((res) => res.json())
      .then((data) => setShifts(data))
      .catch((err) => console.error("Error fetching shifts:", err));
  }, []);

  // ✅ Handle Check In
  const handleCheckIn = async () => {
    if (!selectedUserId || !selectedShiftId) {
      alert("Please select both an employee and a shift.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000?action=attendance&check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: parseInt(selectedUserId, 10),
          shift_id: parseInt(selectedShiftId, 10),
        }),
      });

      if (response.ok) {
        alert("Check-in successful!");
      } else {
        const error = await response.json();
        alert("Check-in failed: " + (error.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error during check-in:", err);
      alert("Check-in failed due to network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Attendance System</h1>

      <Card>
        <CardContent className="space-y-4 p-4">
          {/* Select Employee */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id.toString()}>
                    {user.full_name} - {user.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Shift */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Shift</label>
            <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((shift) => (
                  <SelectItem
                    key={shift.shift_id}
                    value={shift.shift_id.toString()}
                  >
                    {shift.shift_name} ({shift.start_time} - {shift.end_time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Check-in Button */}
          <Button onClick={handleCheckIn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking in...
              </>
            ) : (
              "Check In"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
