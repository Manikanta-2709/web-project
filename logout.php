<?php
session_start();
header('Content-Type: application/json');

// Destroy all session data
$_SESSION = array();
session_destroy();

// Clear session cookie
setcookie(session_name(), '', time() - 3600, '/');

echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
exit;
?>