<?php
function handleCheckin($input) {
    global $connection;

    $user_id  = $input['user_id'] ?? null;
    $shift_id = $input['shift_id'] ?? 1;
    $today    = date('Y-m-d');
    $current_time = date('Y-m-d H:i:s');

    if (!$user_id) {
        jsonResponse(["message" => "user_id required"], 400);
    }

    // Check existing record
    $stmtCheck = $connection->prepare(
        "SELECT check_in_time FROM attendance_records WHERE user_id=? AND date=?"
    );
    $stmtCheck->bind_param("is", $user_id, $today);
    $stmtCheck->execute();
    $resultCheck = $stmtCheck->get_result();
    $existing = $resultCheck->fetch_assoc();

    // Already checked in
    if ($existing && $existing['check_in_time']) {
        jsonResponse([
            "message" => "Already checked in",
            "time" => $existing['check_in_time']
        ]);
    }

    $status = 'Present';
    if ($existing) {
        // Update existing row
        $stmt = $connection->prepare(
            "UPDATE attendance_records SET check_in_time=?, status=? WHERE user_id=? AND date=?"
        );
        $stmt->bind_param("ssis", $current_time, $status, $user_id, $today);
    } else {
        // Insert new row
        $stmt = $connection->prepare(
            "INSERT INTO attendance_records (user_id, date, check_in_time, status, shift_id) VALUES (?,?,?,?,?)"
        );
        $stmt->bind_param("isssi", $user_id, $today, $current_time, $status, $shift_id);
    }

    if ($stmt->execute()) {
        jsonResponse([
            "message" => "Check-in successful",
            "time" => $current_time
        ]);
    } else {
        jsonResponse([
            "message" => "Database error",
            "error" => $stmt->error
        ], 500);
    }
}
