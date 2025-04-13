<?php
include 'db.php';

function checkDatabase() {
    global $conn;
    
    // Check if we can connect
    if ($conn->connect_error) {
        return "Database connection failed: " . $conn->connect_error;
    }
    
    // Check if users table exists and has correct structure
    $result = $conn->query("DESCRIBE users");
    if (!$result) {
        return "Users table not found or inaccessible";
    }
    
    // Check if there are any users in the database
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    $count = $result->fetch_assoc()['count'];
    
    echo "Database connection: SUCCESS\n";
    echo "Users table exists: YES\n";
    echo "Number of registered users: " . $count . "\n";
    
    // Check table structure
    $result = $conn->query("DESCRIBE users");
    echo "\nTable structure:\n";
    while ($row = $result->fetch_assoc()) {
        echo $row['Field'] . " - " . $row['Type'] . "\n";
    }
}

checkDatabase();
?>
