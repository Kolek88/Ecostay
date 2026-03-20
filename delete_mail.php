<?php
include 'db_connect.php';
header('Content-Type: application/json');

$mail_id = $_POST['mail_id'];

$sql = "DELETE FROM notifications WHERE id='$mail_id'";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
$conn->close();
?>