<?php
// Database connection settings
$host_name = "127.0.0.1";
$user_name = "root";
$db_pass   = "secret";
$db_name   = "attendance_management";
$port      = 5051;

// Create connection
$connection = new mysqli($host_name, $user_name, $db_pass, $db_name, $port);

// Check connection
if ($connection->connect_error) {
    die(json_encode(["message" => "Connection failed: " . $connection->connect_error]));
} 

// Set charset to utf8
$connection->set_charset("utf8");
?>