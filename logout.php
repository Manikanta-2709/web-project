<?php
session_start();

// Clear all session data
session_unset();

// Destroy the session
session_destroy();

// Send JSON response
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
?>