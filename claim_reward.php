<?php
include 'db_connect.php';
header('Content-Type: application/json');

$user_id = $_POST['user_id'];

// get current target
$sql = "SELECT reward_target, reward_type FROM users WHERE id = $user_id";
$result = $conn->query($sql);
$row = $result->fetch_assoc();

// set New Goals
$new_target = $row['reward_target'] + 500;

// toggle reward (If 0 become 1, If 1 become 0)
$new_type = ($row['reward_type'] == 0) ? 1 : 0;

// update Database
$update = "UPDATE users SET reward_target = $new_target, reward_type = $new_type WHERE id = $user_id";

if ($conn->query($update) === TRUE) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error"]);
}
$conn->close();
?>