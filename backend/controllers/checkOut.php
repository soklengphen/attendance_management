<?php
function handleCheckout($input) {
    global $connection;
    date_default_timezone_set('Asia/Phnom_Penh');

    $user_id = $input['user_id'] ?? null;
    $today = date('Y-m-d');
    $current_time = date('Y-m-d H:i:s');

    if (!$user_id) {
        jsonResponse(["message" => "user_id required"], 400);
    }

    // 🔸 Fetch today's record
    $stmtCheck = $connection->prepare("
        SELECT attendance_id, check_in_time, check_out_time 
        FROM attendance_records 
        WHERE user_id = ? AND date = ?
        LIMIT 1
    ");
    $stmtCheck->bind_param("is", $user_id, $today);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    $record = $resultCheck->fetch_assoc();

    if (!$record) {
        jsonResponse(["message" => "No check-in record found"], 400);
    }

    if ($record['check_out_time']) {
        jsonResponse([
            "message" => "Already checked out",
            "time" => $record['check_out_time']
        ]);
    }

    if (!$record['check_in_time']) {
        jsonResponse(["message" => "Missing check-in time"], 400);
    }

    // 🔸 Calculate work hours
    $check_in_time = strtotime($record['check_in_time']);
    $check_out_time = strtotime($current_time);

    if ($check_out_time <= $check_in_time) {
        jsonResponse(["message" => "Invalid check-out time"], 400);
    }

    $work_hours = round(($check_out_time - $check_in_time) / 3600, 2);

    // 🔸 Calculate overtime
    $standard_hours = 8;
    $overtime_hours = $work_hours > $standard_hours 
        ? round($work_hours - $standard_hours, 2) 
        : 0;

    // 🔸 Determine status
    $status = 'Present';
    if ($work_hours == 4) {
        $status = 'Half-day';
    }

    // 🔸 Update record
    $stmt = $connection->prepare("
        UPDATE attendance_records 
        SET check_out_time = ?, work_hours = ?, overtime_hours = ?, status = ?
        WHERE user_id = ? AND date = ?
    ");
    $stmt->bind_param("sddsis", $current_time, $work_hours, $overtime_hours, $status, $user_id, $today);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        jsonResponse([
            "message" => "No record was updated. Check user_id and date."
        ], 400);
    }

    jsonResponse([
        "message" => "Check-out successful",
        "time" => $current_time,
        "work_hours" => $work_hours,
        "overtime_hours" => $overtime_hours,
        "status" => $status
    ]);
}
?>
