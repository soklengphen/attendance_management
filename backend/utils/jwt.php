<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . '/../vendor/autoload.php';

// Secret key (⚠️ change this in production)
const JWT_SECRET = "your-secret-key";
const JWT_ALGO   = "HS256";

// Generate JWT
function generateJWT($payload, $expiryHours = 24) {
    $issuedAt = time();
    $expire = $issuedAt + ($expiryHours * 3600);

    $token = [
        "iat" => $issuedAt,
        "exp" => $expire,
        "data" => $payload
    ];

    $jwt = JWT::encode($token, JWT_SECRET, JWT_ALGO);
    error_log("Generated JWT: " . $jwt);

    return $jwt;
}


// Verify JWT
function verifyJWT($token) {
    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, JWT_ALGO));
        error_log("Received JWT: " . json_encode($decoded));

        return (array) $decoded->data;
    } catch (Exception $e) {
        error_log("JWT verification failed: " . $e->getMessage());
        return null;
    }
}

?>
