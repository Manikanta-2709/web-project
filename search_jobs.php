<?php
include 'db.php';
header('Content-Type: application/json');

$keyword = isset($_GET['keyword']) ? '%' . $_GET['keyword'] . '%' : '%';
$location = isset($_GET['location']) ? '%' . $_GET['location'] . '%' : '%';

$sql = "SELECT * FROM jobs WHERE 
        (title LIKE ? OR company LIKE ? OR description LIKE ?) 
        AND location LIKE ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $keyword, $keyword, $keyword, $location);
$stmt->execute();
$result = $stmt->get_result();

$jobs = [];
while ($row = $result->fetch_assoc()) {
    $jobs[] = $row;
}

echo json_encode($jobs);
?>