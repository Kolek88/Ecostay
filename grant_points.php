<?php
include 'db_connect.php';

// Get the JSON data sent from JavaScript
$data = json_decode(file_get_contents('php://input'), true);

$email = $conn->real_escape_string($data['email']);
$points = (int)$data['points'];

// Check if the student actually exists first
$check_sql = "SELECT id FROM users WHERE email = '$email'";
$result = $conn->query($check_sql);

if ($result && $result->num_rows > 0) {
    // If student exists, add the points!
    $update_sql = "UPDATE users SET eco_points = eco_points + $points WHERE email = '$email'";
    if ($conn->query($update_sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Successfully added $points points to $email!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Database error updating points."]);
    }
} else {
    // If student doesn't exist, tell the admin!
    echo json_encode(["status" => "error", "message" => "Error: No student found with email '$email'."]);
}

$conn->close();
?>