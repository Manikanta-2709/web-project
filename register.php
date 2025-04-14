<?php
include 'db.php';
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(['success' => false, 'message' => 'Invalid request method']));
}
header('Content-Type: application/json');

// Verify all required fields
$required = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'accountType'];
foreach ($required as $field) {
    if (empty($_POST[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "$field is required"]);
        exit;
    }
}

// Validate email
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Validate password
if (strlen($_POST['password']) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
    exit;
}

if ($_POST['password'] !== $_POST['confirmPassword']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
    exit;
}

// Validate account type
if (!in_array($_POST['accountType'], ['jobseeker', 'employer'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid account type']);
    exit;
}

// Sanitize inputs
$firstName = htmlspecialchars($_POST['firstName']);
$lastName = htmlspecialchars($_POST['lastName']);
$phone = isset($_POST['phone']) ? preg_replace('/[^0-9]/', '', $_POST['phone']) : '';
$location = isset($_POST['location']) ? htmlspecialchars($_POST['location']) : '';
$experience = isset($_POST['experience']) ? (int)$_POST['experience'] : null;
$skills = isset($_POST['skills']) ? htmlspecialchars($_POST['skills']) : '';
$education = isset($_POST['education']) ? htmlspecialchars($_POST['education']) : '';
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);
$accountType = $_POST['accountType'];

// Check for existing email
try {
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Email already exists']);
        exit;
    }
    
    // Insert new user with transaction
    $conn->begin_transaction();
    
    $stmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, phone, location, experience, skills, education, password, account_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssissss", $firstName, $lastName, $email, $phone, $location, $experience, $skills, $education, $password, $accountType);
    
    if ($stmt->execute()) {
        $userId = $stmt->insert_id;
        
        // Set session data
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_name'] = $firstName;
        $_SESSION['account_type'] = $accountType;
        $_SESSION['logged_in'] = true;
        
        $conn->commit();
        
        echo json_encode(['success' => true]);
    } else {
        $conn->rollback();
        throw new Exception("Database error: " . $stmt->error);
    }
} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>