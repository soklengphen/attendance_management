<?php

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                $stmt = $connection->prepare("USE attendance_management SELECT * FROM users WHERE user_id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result()->fetch_assoc();
                echo json_encode($result ? $result : ["message" => "User not found"]);
            } else {
                $role = isset($_GET['role']) ? $_GET['role'] : null;
                $department = isset($_GET['department']) ? $_GET['department'] : null;

                $where_conditions = [];
                $params = [];
                $types = "";

                if ($role) {
                    $where_conditions[] = "role = ?";
                    $params[] = $role;
                    $types .= "s";
                }

                if ($department) {
                    $where_conditions[] = "department = ?";
                    $params[] = $department;
                    $types .= "s";
                }

                $where_clause = !empty($where_conditions) ? "WHERE " . implode(" AND ", $where_conditions) : "";
                $query = "SELECT * FROM users $where_clause ORDER BY full_name";

                if (!empty($params)) {
                    $stmt = $connection->prepare($query);
                    $stmt->bind_param($types, ...$params);
                    $stmt->execute();
                    $result = $stmt->get_result();
                } else {
                    $result = $connection->query($query);
                }

                $users = [];
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
                echo json_encode($users);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error fetching users", "error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        try {
            if (!isset($input['full_name'], $input['email'])) {
                http_response_code(400);
                echo json_encode(["message" => "full_name and email are required"]);
                break;
            }

            $stmt = $connection->prepare("
                INSERT INTO users (full_name, email, department, role) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "ssss",
                $input['full_name'],
                $input['email'],
                $input['department'] ?? null,
                $input['role'] ?? 'employee'
            );

            if ($stmt->execute()) {
                echo json_encode([
                    "message" => "User created successfully!",
                    "user_id" => $connection->insert_id
                ]);
            } else {
                http_response_code(400);
                echo json_encode(["message" => "Failed to create user", "error" => $stmt->error]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error creating user", "error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        try {
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "User ID is required"]);
                break;
            }

            $stmt = $connection->prepare("
                UPDATE users 
                SET full_name = ?, email = ?, department = ?, role = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ");
            $stmt->bind_param(
                "ssssi",
                $input['full_name'],
                $input['email'],
                $input['department'],
                $input['role'],
                $id
            );

            if ($stmt->execute() && $stmt->affected_rows > 0) {
                echo json_encode(["message" => "User updated successfully!"]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "User not found or no changes made"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error updating user", "error" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        try {
            if (!$id) {
                http_response_code(400);
                echo json_encode(["message" => "User ID is required"]);
                break;
            }

            $stmt = $connection->prepare("DELETE FROM users WHERE user_id = ?");
            $stmt->bind_param("i", $id);

            if ($stmt->execute() && $stmt->affected_rows > 0) {
                echo json_encode(["message" => "User deleted successfully!"]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "User not found"]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error deleting user", "error" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}

?>