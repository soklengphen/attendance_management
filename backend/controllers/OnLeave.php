<?php
function handleLeave($input) {
    global $connection;

    $user_id = $input['user_id'] ?? null;
    $start_date = $input['start_date'] ?? null;
    $end_date = $input['end_date'] ?? null;
    $remark = $input['remarks'] ?? null;
    $leave_type = $input['leave_type'] ?? null; // new field

    if (!$user_id || !$start_date || !$end_date || !$leave_type) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields.']);
        return;
    }

    $start = new DateTime($start_date);
    $end = new DateTime($end_date);

    if ($end < $start) {
        http_response_code(400);
        echo json_encode(['error' => 'End date cannot be earlier than start date.']);
        return;
    }

    $connection->begin_transaction();

    try {
        $period = new DatePeriod($start, new DateInterval('P1D'), $end->modify('+1 day'));
        $stmt = $connection->prepare("
            INSERT INTO attendance_records (user_id, date, status, leave_type, remarks)
            VALUES (?, ?, 'On Leave', ?, ?)
            ON DUPLICATE KEY UPDATE status = 'On Leave', leave_type = VALUES(leave_type), remarks = VALUES(remarks), updated_at = NOW()
        ");

        foreach ($period as $date) {
            $d = $date->format('Y-m-d');
            $stmt->bind_param('isss', $user_id, $d, $leave_type, $remark);
            $stmt->execute();
        }

        $connection->commit();
        echo json_encode(['message' => 'Leave submitted successfully.']);
    } catch (Exception $e) {
        $connection->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to submit leave.', 'details' => $e->getMessage()]);
    }
}
?>
