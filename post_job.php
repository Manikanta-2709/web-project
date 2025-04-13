<?php
include 'db.php';
session_start();

header('Content-Type: application/json');

// Check if the user is logged in and is an employer
if (!isset($_SESSION['user_id']) || $_SESSION['account_type'] !== 'employer') {
    echo json_encode(['success' => false, 'message' => 'You must be logged in as an employer to post a job.']);
    exit;
}

// Get the job details from the request
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['title'], $data['company'], $data['description'], $data['location'], $data['type'], $data['salary'])) {
    echo json_encode(['success' => false, 'message' => 'All job details are required.']);
    exit;
}

$title = $data['title'];
$company = $data['company'];
$description = $data['description'];
$location = $data['location'];
$type = $data['type'];
$salary = $data['salary'];

// Insert the job into the database
$sql = "INSERT INTO jobs (title, company, description, location, type, salary) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", $title, $company, $description, $location, $type, $salary);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Job posted successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to post job: ' . $stmt->error]);
}
?>