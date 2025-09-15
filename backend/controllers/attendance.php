<?php
require_once __DIR__ . '/../config/connection.php';

function handleAttendance($method, $id = null, $input = null, $decoded = null) {
    global $connection;

    $loggedInUserId = $decoded['user_id'] ?? null;

    switch ($method) {
        case 'GET':
            // Employees can only see their own records
            $sql = "SELECT ar.*, u.full_name, u.department, s.shift_name 
                    FROM attendance_records ar 
                    LEFT JOIN users u ON ar.user_id = u.user_id
                    LEFT JOIN shifts s ON ar.shift_id = s.shift_id";
            $conditions = [];

            if ($id) $conditions[] = "ar.attendance_id = $id";

            if ($decoded['role'] === 'employee') {
                $conditions[] = "ar.user_id = $loggedInUserId";
            }

            if (!empty($conditions)) $sql .= " WHERE " . implode(" AND ", $conditions);
            $result = $connection->query($sql);
            echo json_encode($id ? $result->fetch_assoc() : $result->fetch_all(MYSQLI_ASSOC));
            break;

        case 'POST':
            // Only allow admin to create attendance for others
            $userIdToInsert = $decoded['role'] === 'employee' ? $loggedInUserId : ($input['user_id'] ?? null);

            if ($userIdToInsert && isset($input['date'])) {
                $stmt = $connection->prepare("INSERT INTO attendance_records (user_id, date, check_in_time, check_out_time, status, shift_id, work_hours, overtime_hours, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("isssiddds",
                    $userIdToInsert,
                    $input['date'],
                    $input['check_in_time'] ?? null,
                    $input['check_out_time'] ?? null,
                    $input['status'] ?? 'Present',
                    $input['shift_id'] ?? 1,
                    $input['work_hours'] ?? 0,
                    $input['overtime_hours'] ?? 0,
                    $input['remarks'] ?? ''
                );
                $stmt->execute();
                echo json_encode(["message" => "Attendance record created", "record_id" => $connection->insert_id]);
            } else {
                echo json_encode(["message" => "user_id and date are required"]);
            }
            break;

        case 'PUT':
        case 'DELETE':
            // Only admin or the owner can update/delete
            if ($id) {
                $checkSql = "SELECT user_id FROM attendance_records WHERE attendance_id = $id";
                $checkResult = $connection->query($checkSql);
                $record = $checkResult->fetch_assoc();

                if (!$record) {
                    echo json_encode(["message" => "Record not found"]);
                    break;
                }

                if ($decoded['role'] !== 'admin' && $record['user_id'] != $loggedInUserId) {
                    http_response_code(403);
                    echo json_encode(["message" => "Access denied"]);
                    break;
                }
            }

            // Then proceed with your existing PUT/DELETE logic
            // ...
            break;

        default:
            echo json_encode(["message" => "Method not supported"]);
            break;
    }
}

?>
