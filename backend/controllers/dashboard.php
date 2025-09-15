<?php 
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
?>