<?php
include 'db_connect.php';
header('Content-Type: application/json');

// Grab the block name sent from JavaScript
$block = $conn->real_escape_string($_GET['block']);

// Calculate the average base_electric for everyone in that specific block
$sql = "SELECT AVG(base_electric) as avg_usage FROM users WHERE block_name = '$block'";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    // Round the number so it looks clean (e.g., 95 instead of 95.3333)
    echo json_encode(["status" => "success", "avg" => round($row['avg_usage'])]);
} else {
    // Fallback just in case
    echo json_encode(["status" => "error", "avg" => 100]); 
}
$conn->close();
?>