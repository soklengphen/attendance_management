<?php
include('../connection.php');

// Enable CORS for frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get HTTP method and input
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Main API Router
if ($action == 'users') {
    handleUsers();
} elseif ($action == 'attendance') {
    handleAttendance();
} elseif ($action == 'checkin') {
    handleCheckin();
} elseif ($action == 'checkout') {
    handleCheckout();
} elseif ($action == 'dashboard') {
    handleDashboard();
} elseif ($action == 'shifts') {
    handleShifts();
} else {
    // Default health check
    echo json_encode([
        "message" => "Attendance Management API is running",
        "database" => $connection ? "Connected" : "Failed",
        "timestamp" => date('Y-m-d H:i:s'),
        "usage" => "Add ?action=users or ?action=attendance to URL"
    ]);
}

// USERS MANAGEMENT
function handleUsers() {
    global $connection, $method, $input, $id;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single user
                $stmt = $connection->prepare("SELECT * FROM users WHERE user_id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                echo json_encode($result ? $result : ["message" => "User not found"]);
            } else {
                // Get all users
                $result = $connection->query("SELECT * FROM users ORDER BY full_name");
                $users = [];
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
                echo json_encode($users);
            }
            break;

        case 'POST':
            // Create new user
            if (isset($input['full_name'], $input['email'])) {
                $stmt = $connection->prepare("INSERT INTO users (full_name, email, department, role) VALUES (?, ?, ?, ?)");
                $department = $input['department'] ?? '';
                $role = $input['role'] ?? 'employee';
                $stmt->bind_param("ssss", $input['full_name'], $input['email'], $department, $role);
                
                if ($stmt->execute()) {
                    echo json_encode(["message" => "User created successfully", "user_id" => $connection->insert_id]);
                } else {
                    echo json_encode(["message" => "Failed to create user", "error" => $stmt->error]);
                }
            } else {
                echo json_encode(["message" => "full_name and email are required"]);
            }
            break;

        case 'PUT':
            // Update user
            if ($id && $input) {
                $fields = [];
                $values = [];
                $types = "";

                foreach ($input as $key => $value) {
                    $fields[] = "$key = ?";
                    $values[] = $value;
                    $types .= "s";
                }

                if (!empty($fields)) {
                    $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE user_id = ?";
                    $stmt = $connection->prepare($sql);
                    $values[] = $id;
                    $types .= "i";
                    $stmt->bind_param($types, ...$values);

                    if ($stmt->execute()) {
                        echo json_encode(["message" => "User updated successfully"]);
                    } else {
                        echo json_encode(["message" => "Update failed", "error" => $stmt->error]);
                    }
                } else {
                    echo json_encode(["message" => "No fields to update"]);
                }
            } else {
                echo json_encode(["message" => "User ID and data required"]);
            }
            break;

        case 'DELETE':
            // Delete user
            if ($id) {
                $stmt = $connection->prepare("DELETE FROM users WHERE user_id = ?");
                $stmt->bind_param("i", $id);
                if ($stmt->execute()) {
                    echo json_encode(["message" => "User deleted successfully"]);
                } else {
                    echo json_encode(["message" => "Delete failed", "error" => $stmt->error]);
                }
            } else {
                echo json_encode(["message" => "User ID is required"]);
            }
            break;

        default:
            echo json_encode(["message" => "Method not supported"]);
            break;
    }
}

// ATTENDANCE MANAGEMENT
function handleAttendance() {
    global $connection, $method, $input, $id;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single attendance record
                $stmt = $connection->prepare("
                    SELECT ar.*, u.full_name, u.department, s.shift_name 
                    FROM attendance_records ar
                    LEFT JOIN users u ON ar.user_id = u.user_id
                    LEFT JOIN shifts s ON ar.shift_id = s.shift_id
                    WHERE ar.attendance_id = ?
                ");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                echo json_encode($result ? $result : ["message" => "Record not found"]);
            } else {
                // Get all attendance records
                $date = isset($_GET['date']) ? $_GET['date'] : '';
                $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
                
                $sql = "
                    SELECT ar.*, u.full_name, u.department, u.email, s.shift_name 
                    FROM attendance_records ar
                    LEFT JOIN users u ON ar.user_id = u.user_id
                    LEFT JOIN shifts s ON ar.shift_id = s.shift_id
                ";
                
                $conditions = [];
                if ($date) $conditions[] = "ar.date = '$date'";
                if ($user_id) $conditions[] = "ar.user_id = $user_id";
                
                if (!empty($conditions)) {
                    $sql .= " WHERE " . implode(" AND ", $conditions);
                }
                
                $sql .= " ORDER BY ar.date DESC, ar.check_in_time DESC LIMIT 50";
                
                $result = $connection->query($sql);
                $records = [];
                while ($row = $result->fetch_assoc()) {
                    $records[] = $row;
                }
                echo json_encode($records);
            }
            break;

        case 'POST':
            // Create attendance record
            if (isset($input['user_id'], $input['date'])) {
                $stmt = $connection->prepare("
                    INSERT INTO attendance_records 
                    (user_id, date, check_in_time, check_out_time, status, shift_id, work_hours, overtime_hours, remarks) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $check_in = $input['check_in_time'] ?? null;
                $check_out = $input['check_out_time'] ?? null;
                $status = $input['status'] ?? 'Present';
                $shift_id = $input['shift_id'] ?? 1;
                $work_hours = $input['work_hours'] ?? 0;
                $overtime_hours = $input['overtime_hours'] ?? 0;
                $remarks = $input['remarks'] ?? '';
                
                $stmt->bind_param("isssiddds", 
                    $input['user_id'], $input['date'], $check_in, $check_out, 
                    $status, $shift_id, $work_hours, $overtime_hours, $remarks
                );

                if ($stmt->execute()) {
                    echo json_encode(["message" => "Attendance record created", "record_id" => $connection->insert_id]);
                } else {
                    echo json_encode(["message" => "Failed to create record", "error" => $stmt->error]);
                }
            } else {
                echo json_encode(["message" => "user_id and date are required"]);
            }
            break;

        case 'PUT':
            // Update attendance record
            if ($id && $input) {
                $fields = [];
                $values = [];
                $types = "";

                foreach ($input as $key => $value) {
                    $fields[] = "$key = ?";
                    $values[] = $value;
                    $types .= is_numeric($value) ? "d" : "s";
                }

                if (!empty($fields)) {
                    $sql = "UPDATE attendance_records SET " . implode(", ", $fields) . " WHERE attendance_id = ?";
                    $stmt = $connection->prepare($sql);
                    $values[] = $id;
                    $types .= "i";
                    $stmt->bind_param($types, ...$values);

                    if ($stmt->execute()) {
                        echo json_encode(["message" => "Record updated successfully"]);
                    } else {
                        echo json_encode(["message" => "Update failed", "error" => $stmt->error]);
                    }
                } else {
                    echo json_encode(["message" => "No fields to update"]);
                }
            } else {
                echo json_encode(["message" => "Record ID and data required"]);
            }
            break;

        case 'DELETE':
            // Delete attendance record
            if ($id) {
                $stmt = $connection->prepare("DELETE FROM attendance_records WHERE attendance_id = ?");
                $stmt->bind_param("i", $id);
                if ($stmt->execute()) {
                    echo json_encode(["message" => "Record deleted successfully"]);
                } else {
                    echo json_encode(["message" => "Delete failed", "error" => $stmt->error]);
                }
            } else {
                echo json_encode(["message" => "Record ID is required"]);
            }
            break;

        default:
            echo json_encode(["message" => "Method not supported"]);
            break;
    }
}

// CHECK-IN FUNCTION
function handleCheckin() {
    global $connection, $method, $input;
    
    if ($method !== 'POST') {
        echo json_encode(["message" => "Only POST method allowed"]);
        return;
    }

    if (!isset($input['user_id'])) {
        echo json_encode(["message" => "user_id is required"]);
        return;
    }

    $user_id = $input['user_id'];
    $shift_id = $input['shift_id'] ?? 1;
    $today = date('Y-m-d');
    $current_time = date('Y-m-d H:i:s');

    // Check if already checked in today
    $check = $connection->query("SELECT * FROM attendance_records WHERE user_id = $user_id AND date = '$today'");
    $existing = $check->fetch_assoc();

    if ($existing && $existing['check_in_time']) {
        echo json_encode(["message" => "Already checked in today", "time" => $existing['check_in_time']]);
        return;
    }

    if ($existing) {
        // Update existing record
        $stmt = $connection->prepare("UPDATE attendance_records SET check_in_time = ?, status = 'Present' WHERE user_id = ? AND date = ?");
        $stmt->bind_param("sis", $current_time, $user_id, $today);
    } else {
        // Create new record
        $stmt = $connection->prepare("INSERT INTO attendance_records (user_id, date, check_in_time, status, shift_id) VALUES (?, ?, ?, 'Present', ?)");
        $stmt->bind_param("issi", $user_id, $today, $current_time, $shift_id);
    }

    if ($stmt->execute()) {
        echo json_encode(["message" => "Check-in successful", "time" => $current_time]);
    } else {
        echo json_encode(["message" => "Check-in failed", "error" => $stmt->error]);
    }
}

// CHECK-OUT FUNCTION
function handleCheckout() {
    global $connection, $method, $input;
    
    if ($method !== 'POST') {
        echo json_encode(["message" => "Only POST method allowed"]);
        return;
    }

    if (!isset($input['user_id'])) {
        echo json_encode(["message" => "user_id is required"]);
        return;
    }

    $user_id = $input['user_id'];
    $today = date('Y-m-d');
    $current_time = date('Y-m-d H:i:s');

    // Get today's record
    $result = $connection->query("SELECT * FROM attendance_records WHERE user_id = $user_id AND date = '$today'");
    $record = $result->fetch_assoc();

    if (!$record) {
        echo json_encode(["message" => "No check-in found for today"]);
        return;
    }

    if ($record['check_out_time']) {
        echo json_encode(["message" => "Already checked out today", "time" => $record['check_out_time']]);
        return;
    }

    // Calculate work hours
    if ($record['check_in_time']) {
        $check_in = new DateTime($record['check_in_time']);
        $check_out = new DateTime($current_time);
        $diff = $check_in->diff($check_out);
        $work_hours = $diff->h + ($diff->i / 60);
        $overtime_hours = max(0, $work_hours - 8);
    } else {
        $work_hours = 0;
        $overtime_hours = 0;
    }

    // Update record
    $stmt = $connection->prepare("UPDATE attendance_records SET check_out_time = ?, work_hours = ?, overtime_hours = ? WHERE attendance_id = ?");
    $stmt->bind_param("sddi", $current_time, $work_hours, $overtime_hours, $record['attendance_id']);

    if ($stmt->execute()) {
        echo json_encode([
            "message" => "Check-out successful", 
            "time" => $current_time, 
            "work_hours" => round($work_hours, 2),
            "overtime_hours" => round($overtime_hours, 2)
        ]);
    } else {
        echo json_encode(["message" => "Check-out failed", "error" => $stmt->error]);
    }
}

// DASHBOARD DATA
function handleDashboard() {
    global $connection, $method;
    
    if ($method !== 'GET') {
        echo json_encode(["message" => "Only GET method allowed"]);
        return;
    }

    $today = date('Y-m-d');

    // Get basic stats
    $total_users = $connection->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];
    $present_today = $connection->query("SELECT COUNT(*) as count FROM attendance_records WHERE date = '$today' AND status = 'Present'")->fetch_assoc()['count'];
    $absent_today = $connection->query("SELECT COUNT(*) as count FROM attendance_records WHERE date = '$today' AND status = 'Absent'")->fetch_assoc()['count'];
    
    // Get recent attendance
    $recent_result = $connection->query("
        SELECT ar.*, u.full_name 
        FROM attendance_records ar 
        JOIN users u ON ar.user_id = u.user_id 
        ORDER BY ar.date DESC, ar.check_in_time DESC 
        LIMIT 5
    ");
    
    $recent = [];
    while ($row = $recent_result->fetch_assoc()) {
        $recent[] = $row;
    }

    echo json_encode([
        "total_users" => intval($total_users),
        "present_today" => intval($present_today),
        "absent_today" => intval($absent_today),
        "attendance_rate" => $total_users > 0 ? round(($present_today / $total_users) * 100, 1) : 0,
        "recent_attendance" => $recent,
        "date" => $today
    ]);
}

// SHIFTS DATA
function handleShifts() {
    global $connection, $method;
    
    if ($method !== 'GET') {
        echo json_encode(["message" => "Only GET method allowed"]);
        return;
    }

    $result = $connection->query("SELECT * FROM shifts ORDER BY shift_name");
    $shifts = [];
    while ($row = $result->fetch_assoc()) {
        $shifts[] = $row;
    }
    echo json_encode($shifts);
}
?>