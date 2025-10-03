<?php
// ------------------- CORS -------------------
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// ------------------- Handle preflight OPTIONS -------------------
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["message" => "Preflight OK"]);
    exit();
}

// ------------------- Includes -------------------
require_once('./vendor/autoload.php');
require_once('./config/connection.php');
require_once('./middleware/authenticate.php');

// Controllers (functions only)
require_once('./controllers/user.php');
require_once('./controllers/attendance.php');
require_once('./controllers/auth.php');
require_once('./controllers/checkIn.php');
require_once('./controllers/checkOut.php');
require_once('./controllers/shifts.php');
require_once('./controllers/dashboard.php');
require_once('./controllers/onLeave.php');

// ------------------- Helper -------------------
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// ------------------- Read request -------------------
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents("php://input"), true);
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = $_GET['action'] ?? '';

// ------------------- Public routes -------------------
$publicRoutes = ['login', 'register'];

$decoded = null;
if (!in_array($action, $publicRoutes)) {
    $decoded = authenticate(); // JWT authentication
}

// ------------------- Route handling -------------------
switch ($action) {
    case 'login':
        handleLogin($input, $connection);
        break;

    case 'register':
        handleRegister($input, $connection);
        break;

    case 'users':
        if ($method !== 'GET') {
            if ($decoded['role'] !== 'admin') {
            jsonResponse(["message" => "Forbidden: Admins only"], 403);
        }
        }
      
        handleUsers($method, $id, $input, $decoded);
        break;

    case 'attendance':
        handleAttendance($method, $id, $input, $decoded);
        break;

    case 'checkin':
        handleCheckin($input);
        break;

    case 'leave':
        handleLeave($input);
        break;

    case 'checkout':

        handleCheckout($input);
        break;

    case 'dashboard':
        handleDashboard();
        break;

    case 'shifts':
        handleShifts();
        break;

    default:
        break;
}
