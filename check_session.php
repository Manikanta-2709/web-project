<?php
// Set secure session cookie parameters BEFORE starting the session
session_set_cookie_params([
    'lifetime' => 86400, // 1 day
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'],
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Strict'
]);

session_start();
header('Content-Type: application/json');

// Check if session is valid and not expired
if (isset($_SESSION['user_id'], $_SESSION['logged_in'], $_SESSION['last_activity'])) {
    // Check if session has expired (1 day)
    if (time() - $_SESSION['last_activity'] > 86400) {
        // Session expired
        session_unset();
        session_destroy();
        echo json_encode(['loggedIn' => false]);
        exit;
    }
    
    // Update last activity time
    $_SESSION['last_activity'] = time();
    
    echo json_encode([
        'loggedIn' => true,
        'userName' => $_SESSION['user_name'],
        'accountType' => $_SESSION['account_type']
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
?>