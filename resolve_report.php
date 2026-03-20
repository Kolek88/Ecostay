<?php
include 'db_connect.php';
header('Content-Type: application/json');

$report_id = $_POST['report_id'];
$student_email = $_POST['student_email'];

$conn->query("UPDATE reports SET status='fixed' WHERE id='$report_id'");
$sql = "UPDATE users SET eco_points = eco_points + 50 WHERE email='$student_email'";

if ($conn->query($sql) === TRUE) {
    // send in-game mail
    $title = "Maintenance Fixed! 🛠️";
    $msg = "Thank you for reporting the issue! The facility team has resolved it. You have been awarded +50 Eco-Points!";
    $conn->query("INSERT INTO notifications (user_email, title, message) VALUES ('$student_email', '$title', '$msg')");
    
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
$conn->close();
?>