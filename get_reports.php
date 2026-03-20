<?php
include 'db_connect.php';
header('Content-Type: application/json');

$sql = "SELECT r.id, r.user_email, r.issue, r.location, r.description, r.photo_url, r.report_date, u.username 
        FROM reports r JOIN users u ON r.user_email = u.email 
        WHERE r.status = 'pending' ORDER BY r.report_date DESC";

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