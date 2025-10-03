<?php
require_once __DIR__ . '/../config/connection.php';

function handleUsers($method, $id = null, $input = null) {
    global $connection;

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $connection->prepare("SELECT * FROM users WHERE user_id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                echo json_encode($stmt->get_result()->fetch_assoc() ?? ["message" => "User not found"]);
            } else {
                $result = $connection->query("SELECT * FROM users ORDER BY full_name");
                $users = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($users);
            }
            break;

        case 'POST':
            if (isset($input['full_name'], $input['email'])) {
                $full_name  = $input['full_name'];
                $email      = $input['email'];
                $department = $input['department'] ?? '';
                $role       = $input['role'] ?? 'employee';

                // Default password
                $defaultPassword = "Aa!12345";
                $hashedPassword  = password_hash($defaultPassword, PASSWORD_BCRYPT);

                $stmt = $connection->prepare(
                    "INSERT INTO users (full_name, email, department, role, password) 
                    VALUES (?, ?, ?, ?, ?)"
                );
                $stmt->bind_param("sssss", $full_name, $email, $department, $role, $hashedPassword);
                $stmt->execute();

                echo json_encode([
                    "message" => "User created with default password",
                    "user_id" => $connection->insert_id,
                    "default_password" => $defaultPassword 
                ]);
            } else {
                echo json_encode(["message" => "full_name and email required"]);
            }
            break;


        case 'PUT':
            if ($id && $input) {
                $fields = [];
                $values = [];
                $types = "";
                foreach ($input as $key => $value) {
                    $fields[] = "$key=?";
                    $values[] = $value;
                    $types .= "s";
                }
                $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE user_id=?";
                $stmt = $connection->prepare($sql);
                $values[] = $id;
                $types .= "i";
                $stmt->bind_param($types, ...$values);
                $stmt->execute();
                echo json_encode(["message" => "User updated"]);
            }
            break;

        case 'DELETE':
            if ($id) {
                $stmt = $connection->prepare("DELETE FROM users WHERE user_id=?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                echo json_encode(["message" => "User deleted"]);
            }
            break;

        default:
            echo json_encode(["message" => "Method not allowed"]);
    }
}
?>
