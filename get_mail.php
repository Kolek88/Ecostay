<?php
include 'db_connect.php';
header('Content-Type: application/json');

$email = $_GET['email'];
$sql = "SELECT * FROM notifications WHERE user_email='$email' ORDER BY created_at DESC LIMIT 5";
$result = $conn->query($sql);
$data = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) { $data[] = $row; }
}
echo json_encode($data);
$conn->close();
?>