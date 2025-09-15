<?php
function handleCheckout($input) {
    global $connection;

    $user_id = $input['user_id'] ?? null;
    $today = date('Y-m-d');
    $current_time = date('Y-m-d H:i:s');

    if (!$user_id) {
        jsonResponse(["message" => "user_id required"], 400);
    }

    // Fetch today record
    $stmtCheck = $connection->prepare("SELECT check_in_time, check_out_time FROM attendance_records WHERE user_id=? AND date=?");
    $stmtCheck->bind_param("is", $user_id, $today);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    $record = $resultCheck->fetch_assoc();

    if (!$record) {
        jsonResponse(["message" => "No check-in record found"], 400);
    }

    if ($record['check_out_time']) {
        jsonResponse(["message" => "Already checked out", "time" => $record['check_out_time']]);
    }

    // Calculate work hours
    $check_in_time = strtotime($record['check_in_time']);
    $check_out_time = strtotime($current_time);
    $work_hours = round(($check_out_time - $check_in_time) / 3600, 2);

    $stmt = $connection->prepare("UPDATE attendance_records SET check_out_time=?, work_hours=? WHERE user_id=? AND date=?");
    $stmt->bind_param("sdis", $current_time, $work_hours, $user_id, $today);

    if ($stmt->execute()) {
        jsonResponse([
            "message" => "Check-out successful",
            "time" => $current_time,
            "work_hours" => $work_hours
        ]);
    } else {
        jsonResponse(["message" => "Database error", "error" => $stmt->error], 500);
    }
}
