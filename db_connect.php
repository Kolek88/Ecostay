<?php
$servername = "fdb1028.awardspace.net"; 
$username = "4526606_khaliq";           
$password = "CONFIDENTIAL_GITHUB";    
$dbname = "4526606_khaliq";    

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4"); 


?>