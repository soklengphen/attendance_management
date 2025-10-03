<?php
// Database connection settings
$host_name = "localhost";
$user_name = "root";
$db_pass   = "";
$db_name   = "attendance_management";
$port      = 3306;

// Create connection
$connection = new mysqli($host_name, $user_name, $db_pass, $db_name, $port);

// Check connection
if ($connection->connect_error) {
    die(json_encode(["message" => "Connection failed: " . $connection->connect_error]));
} 

// Set charset to utf8
$connection->set_charset("utf8");
?>