<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'jobconnect';

// Create connection with error handling
try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    
    // Set charset to utf8mb4
    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception("Error loading character set utf8mb4: " . $conn->error);
    }

    // Verify connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Create tables with transactions
    $conn->begin_transaction();
    
    try {
        $tables = [
            'users' => "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                location VARCHAR(100),
                experience INT,
                skills TEXT,
                education VARCHAR(100),
                password VARCHAR(255) NOT NULL,
                account_type ENUM('jobseeker', 'employer') NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB",
            
            'jobs' => "CREATE TABLE IF NOT EXISTS jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                company VARCHAR(100) NOT NULL,
                description TEXT,
                location VARCHAR(100),
                type ENUM('full-time', 'part-time', 'remote') NOT NULL,
                salary VARCHAR(50),
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_type (type),
                INDEX idx_location (location)
            ) ENGINE=InnoDB",
            
            'job_applications' => "CREATE TABLE IF NOT EXISTS job_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                user_id INT NOT NULL,
                status ENUM('pending', 'reviewed', 'interview', 'hired', 'rejected') DEFAULT 'pending',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                INDEX idx_job_user (job_id, user_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB"
        ];

        foreach ($tables as $table => $sql) {
            if (!$conn->query($sql)) {
                throw new Exception("Error creating table $table: " . $conn->error);
            }
        }
        
        $conn->commit();
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
} catch (Exception $e) {
    error_log("Database error: " . $e->getMessage());
    die("A database error occurred. Please try again later.");
}
?>