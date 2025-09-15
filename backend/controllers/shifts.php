<?php 
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