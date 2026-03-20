<?php
include 'db_connect.php';
header('Content-Type: application/json');

//  Force the server to use Malaysia Time
date_default_timezone_set('Asia/Kuala_Lumpur');
$current_time = date('Y-m-d H:i:s'); 

$email = $_POST['user_email'];
$issue = $_POST['issue'];
$location = $_POST['location'];
$description = $conn->real_escape_string($_POST['description']); 
$photo_url = "";

// Check if a photo was uploaded
if(isset($_FILES['photo']) && $_FILES['photo']['error'] == 0) {
    $target_dir = "uploads/";
    $file_name = time() . "_" . basename($_FILES["photo"]["name"]); 
    $target_file = $target_dir . $file_name;
    
    if (move_uploaded_file($_FILES["photo"]["tmp_name"], $target_file)) {
        $photo_url = $target_file; 
    }
}

// inject the $current_time directly into the database
$sql = "INSERT INTO reports (user_email, issue, location, description, photo_url, report_date) 
        VALUES ('$email', '$issue', '$location', '$description', '$photo_url', '$current_time')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
$conn->close();
?>