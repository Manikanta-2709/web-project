<?php
session_start();
header('Content-Type: application/json');

// Regenerate session ID to prevent fixation
if (!isset($_SESSION['initiated'])) {
    session_regenerate_id();
    $_SESSION['initiated'] = true;
}

// Validate session data
$response = ['loggedIn' => false];
if (isset($_SESSION['user_id'], $_SESSION['logged_in'])) {
    // Additional validation
    if (is_numeric($_SESSION['user_id']) && 
        is_bool($_SESSION['logged_in']) && 
        in_array($_SESSION['account_type'] ?? '', ['jobseeker', 'employer'])) {
        $response = [
            'loggedIn' => true,
            'userId' => (int)$_SESSION['user_id'],
            'userName' => htmlspecialchars($_SESSION['user_name'] ?? ''),
            'accountType' => $_SESSION['account_type'] ?? 'jobseeker'
        ];
    } else {
        // Invalid session data - destroy session
        session_unset();
        session_destroy();
    }
}

echo json_encode($response);
?>