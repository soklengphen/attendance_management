<?php
require_once __DIR__ . '/../config/connection.php';
require_once __DIR__ . '/../utils/jwt.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);

if ($method === 'POST' && isset($_GET['action'])) {
    if ($_GET['action'] === 'register') {
        handleRegister($input, $connection);
    } elseif ($_GET['action'] === 'login') {
        handleLogin($input, $connection);
    } 
}
function handleRegister($input, $connection) {
    if (!isset($input['full_name'], $input['email'], $input['password'], $input['confirm_password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        exit();
    }

    if ($input['password'] !== $input['confirm_password']) {
        http_response_code(400);
        echo json_encode(["error" => "Password and confirm password do not match"]);
        exit();
    }

    $email = $input['email'];

    // Check if email already exists first
    $checkStmt = $connection->prepare("SELECT user_id FROM users WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["error" => "Email already registered"]);
        exit();
    }

    // Insert user
    $full_name = $input['full_name'];
    $password = password_hash($input['password'], PASSWORD_BCRYPT);
    $department = $input['department'] ?? null;
    $role = $input['role'] ?? 'employee';

    $stmt = $connection->prepare("INSERT INTO users (full_name, email, password, department, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $full_name, $email, $password, $department, $role);

    if ($stmt->execute()) {
        echo json_encode(["message" => "User registered successfully", "user_id" => $connection->insert_id]);
        exit(); // <--- important
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to register user"]);
        exit();
    }
}

function handleLogin($input, $connection) {
    header("Content-Type: application/json; charset=utf-8");

    if (!isset($input['email'], $input['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing email or password"]);
        exit;
    }

    $stmt = $connection->prepare("SELECT user_id, full_name, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $input['email']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        if (password_verify($input['password'], $user['password'])) {
            $token = generateJWT([
                "user_id" => $user['user_id'],
                "email" => $user['email'],
                "role" => $user['role']
            ]);

            echo json_encode([
                "message" => "Login successful",
                "token" => $token,
                "user" => [
                    "user_id" => $user['user_id'],
                    "full_name" => $user['full_name'],
                    "email" => $user['email'],
                    "role" => $user['role']
                ]
            ]);
            exit;
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid password"]);
            exit;
        }
    } else {
        http_response_code(404);
        echo json_encode(["error" => "User not found"]);
        exit;
    }
}
