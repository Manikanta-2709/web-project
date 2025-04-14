<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set secure session cookie parameters BEFORE starting the session
session_set_cookie_params([
    'lifetime' => 86400, // 1 day
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Strict'
]);

// Start the session
session_start();

// Debug logging
error_log("Login attempt - Session ID: " . session_id());
error_log("POST data: " . print_r($_POST, true));

include 'db.php';

// Verify the request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed']));
}

// Validate input
if (empty($_POST['email']) || empty($_POST['password'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Email and password are required']));
}

// Sanitize email
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid email format']));
}

try {
    // Get user from database
    $stmt = $conn->prepare("SELECT id, first_name, password, account_type FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        error_log("Login failed - User not found: " . $email);
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
    }

    $user = $result->fetch_assoc();

    // Verify password
    if (!password_verify($_POST['password'], $user['password'])) {
        error_log("Login failed - Invalid password for user: " . $email);
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
    }

    // Regenerate session ID to prevent fixation
    session_regenerate_id(true);

    // Set session data
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['first_name'];
    $_SESSION['account_type'] = $user['account_type'];
    $_SESSION['logged_in'] = true;
    $_SESSION['last_activity'] = time();

    error_log("Login successful - User: " . $user['first_name'] . ", Session ID: " . session_id());

    // Success response
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'userName' => htmlspecialchars($user['first_name']),
        'accountType' => $user['account_type']
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred. Please try again.']);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>