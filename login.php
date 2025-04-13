<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

// Validate input
if (empty($_POST['email']) || empty($_POST['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

// Sanitize and validate email
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Prepare statement with error handling
try {
    $stmt = $conn->prepare("SELECT id, first_name, password, account_type FROM users WHERE email = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Generic message to prevent user enumeration
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }

    $user = $result->fetch_assoc();
    
    // Verify password
    if (password_verify($_POST['password'], $user['password'])) {
        // Regenerate session ID
        session_regenerate_id(true);
        
        // Set session data
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['first_name'];
        $_SESSION['account_type'] = $user['account_type'];
        $_SESSION['logged_in'] = true;
        $_SESSION['last_activity'] = time();
        
        // Set secure cookie params
        $cookieParams = session_get_cookie_params();
        session_set_cookie_params([
            'lifetime' => $cookieParams["lifetime"],
            'path' => '/',
            'domain' => $_SERVER['HTTP_HOST'],
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'userName' => htmlspecialchars($user['first_name']),
            'accountType' => $user['account_type']
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>