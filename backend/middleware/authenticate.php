<?php
require_once __DIR__ . '/../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function getAuthorizationHeader() {
    if (isset($_SERVER['Authorization'])) {
        return trim($_SERVER['Authorization']);
    } 
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx / FastCGI
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    } 
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) { // Apache mod_rewrite
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }
    if (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        foreach ($requestHeaders as $key => $value) {
            if (strcasecmp($key, 'Authorization') === 0) {
                return trim($value);
            }
        }
    }
    return null;
}

function authenticate() {
    $authHeader = getAuthorizationHeader();

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(["message" => "Authorization header missing"]);
        exit();
    }

    $token = str_replace("Bearer ", "", $authHeader);
    $secret_key = "your-secret-key";

    try {
        $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key($secret_key, 'HS256'));
        return (array) $decoded->data; // <- convert to array
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid token", "error" => $e->getMessage()]);
        exit();
    }
}


?>
