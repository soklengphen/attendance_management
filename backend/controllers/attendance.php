<?php
require_once __DIR__ . '/../config/connection.php';

function handleAttendance($method, $id = null, $input = null, $decoded = null) {
    global $connection;

    $loggedInUserId = $decoded['user_id'] ?? null;

    switch ($method) {
        case 'GET':
            // Base query
            $sql = "SELECT ar.*, u.full_name, u.department, s.shift_name 
                    FROM attendance_records ar 
                    LEFT JOIN users u ON ar.user_id = u.user_id
                    LEFT JOIN shifts s ON ar.shift_id = s.shift_id";
            $conditions = [];

           
            if ($id) {
                $conditions[] = "ar.attendance_id = " . intval($id);
            }

            if ($decoded['role'] === 'employee') {
                $conditions[] = "ar.user_id = " . intval($loggedInUserId);
            }

            if (isset($_GET['search']) && $_GET['search'] !== '') {
                $search = $connection->real_escape_string($_GET['search']);
                $conditions[] = "u.full_name LIKE '%$search%'";
            }

            if (isset($_GET['status']) && $_GET['status'] !== '') {
                $status = $connection->real_escape_string($_GET['status']);
                $conditions[] = "ar.status = '$status'";
            }

            if (isset($_GET['start_date']) && $_GET['start_date'] !== '' && 
                isset($_GET['end_date']) && $_GET['end_date'] !== '') {
                $start_date = $connection->real_escape_string($_GET['start_date']);
                $end_date   = $connection->real_escape_string($_GET['end_date']);
                $conditions[] = "ar.date BETWEEN '$start_date' AND '$end_date'";
            } elseif (isset($_GET['date']) && $_GET['date'] !== '') {
                $date = $connection->real_escape_string($_GET['date']);
                $conditions[] = "ar.date = '$date'";
            }

            if (!empty($conditions)) {
                $sql .= " WHERE " . implode(" AND ", $conditions);
            }

            $sql .= " ORDER BY ar.created_at DESC";

            $result = $connection->query($sql);

            if (!$result) {
                http_response_code(500);
                echo json_encode(["error" => $connection->error]);
                break;
            }

            $data = $id ? [$result->fetch_assoc()] : $result->fetch_all(MYSQLI_ASSOC);

            foreach ($data as &$row) {
                if (isset($row['work_hours']) && floatval($row['work_hours']) == 4 && $row['status'] !== 'Half-day') {
                    $attendanceId = intval($row['attendance_id']);
                    $update = $connection->prepare("UPDATE attendance_records SET status = 'Half-day' WHERE attendance_id = ?");
                    $update->bind_param("i", $attendanceId);
                    $update->execute();
                    $row['status'] = 'Half-day'; // reflect change in response
                } else if (isset($row['work_hours']) && floatval($row['work_hours']) < 4 && $row['status'] !== 'On Leave') {
                    $attendanceId = intval($row['attendance_id']);
                    $update = $connection->prepare("UPDATE attendance_records SET status = 'Absent' WHERE attendance_id = ?");
                    $update->bind_param("i", $attendanceId);
                    $update->execute();
                    $row['status'] = 'Absent'; // reflect change in response
                } else {
                    
                }
            }

            echo json_encode($id ? $data[0] : $data);
            break;

        case 'POST':
            // Only allow admin to create attendance for others
            $userIdToInsert = $decoded['role'] === 'employee' ? $loggedInUserId : ($input['user_id'] ?? null);

            if ($userIdToInsert && isset($input['date'])) {
                $stmt = $connection->prepare("INSERT INTO attendance_records 
                    (user_id, date, check_in_time, check_out_time, status, shift_id, work_hours, overtime_hours, remarks) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
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
                http_response_code(400);
                echo json_encode(["message" => "user_id and date are required"]);
            }
            break;

        case 'PUT':
        case 'DELETE':
            // Permission check
            if ($id) {
                $checkSql = "SELECT user_id FROM attendance_records WHERE attendance_id = " . intval($id);
                $checkResult = $connection->query($checkSql);
                $record = $checkResult->fetch_assoc();

                if (!$record) {
                    http_response_code(404);
                    echo json_encode(["message" => "Record not found"]);
                    break;
                }

                if ($decoded['role'] !== 'admin' && $record['user_id'] != $loggedInUserId) {
                    http_response_code(403);
                    echo json_encode(["message" => "Access denied"]);
                    break;
                }
            }

            // TODO: Add your PUT/DELETE update logic here
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Method not supported"]);
            break;
    }
}
?>
