<?php
$db_host = 'fdb1028.awardspace.net';  
$db_user = '4526606_khaliq';  
$db_pass = 'CONFIDENTIAL_GITHUB';  
$db_name = '4526606_khaliq';  

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) die(json_encode(["status" => "error", "message" => "Connection failed"]));

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $points = $_POST['eco_points'];
    $quiz_date = $_POST['last_quiz_date'];
    $wordle_date = $_POST['last_wordle_date'];
    $missions = $_POST['completed_missions'];
    $target = $_POST['reward_target']; 

    
    $sql = "UPDATE users SET 
            eco_points='$points', 
            last_quiz_date='$quiz_date', 
            last_wordle_date='$wordle_date',
            completed_missions='$missions',
            reward_target='$target' 
            WHERE email='$email'"; 

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
}
$conn->close();
?>