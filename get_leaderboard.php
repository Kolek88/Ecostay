<?php
include 'db_connect.php';
header('Content-Type: application/json');

$type = isset($_GET['type']) ? $_GET['type'] : 'points';

if ($type === 'points') {
    // Top Points: Show individual students
    $sql = "SELECT username, block_name, eco_points FROM users ORDER BY eco_points DESC LIMIT 10";
} else {
    // Lowest Usage: Group by block and calculate the average electricity
    $sql = "SELECT block_name, 
            ROUND(AVG(base_electric)) as base_electric 
            FROM users 
            GROUP BY block_name 
            ORDER BY base_electric ASC 
            LIMIT 10";
} 

$result = $conn->query($sql);
$data = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}
echo json_encode($data);
$conn->close();
?>