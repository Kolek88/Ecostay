<?php
include 'db_connect.php';
header('Content-Type: application/json');

$report_id = $_POST['report_id'];
$student_email = $_POST['student_email'];

// Mark as rejected
$conn->query("UPDATE reports SET status='rejected' WHERE id='$report_id'");

// SEND REJECTION MAIL
$title = "Report Rejected ❌";
$msg = "Your recent maintenance report could not be processed. It may have been a duplicate, or the photo proof was invalid. No points were awarded.";
$conn->query("INSERT INTO notifications (user_email, title, message) VALUES ('$student_email', '$title', '$msg')");

echo json_encode(["status" => "success"]);
$conn->close();
?>