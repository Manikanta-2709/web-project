<?php
include 'db.php';
session_start();

header('Content-Type: application/json');

// Verify CSRF token
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to apply for a job.']);
    exit;
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['jobId']) || !is_numeric($input['jobId'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid job ID']);
    exit;
}

$jobId = (int)$input['jobId'];
$userId = (int)$_SESSION['user_id'];

try {
    // Check if job exists
    $stmt = $conn->prepare("SELECT id FROM jobs WHERE id = ?");
    $stmt->bind_param("i", $jobId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Job not found']);
        exit;
    }
    
    // Check if already applied
    $stmt = $conn->prepare("SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $jobId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'You have already applied for this job.']);
        exit;
    }
    
    // Insert application
    $stmt = $conn->prepare("INSERT INTO job_applications (job_id, user_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $jobId, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Job application submitted successfully.']);
    } else {
        throw new Exception("Database error: " . $stmt->error);
    }
} catch (Exception $e) {
    error_log("Application error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to submit job application.']);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>