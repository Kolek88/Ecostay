<?php
include 'db_connect.php';
header('Content-Type: application/json');

// Prevent apostrophes from crashing the database
$title = $conn->real_escape_string($_POST['title']);
$message = $conn->real_escape_string($_POST['message']);

if(empty($title) || empty($message)) {
    echo json_encode(["status" => "error", "message" => "Fields cannot be empty."]);
    exit;
}

// Find all email in the users table and drops the mail in their inbox!
$sql = "INSERT INTO notifications (user_email, title, message) 
        SELECT email, '📢 $title', '$message' FROM users";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
$conn->close();
?>