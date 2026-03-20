<?php
include 'db_connect.php';
header('Content-Type: application/json; charset=utf-8');

$user_id = $_GET['id'];

// fetch consumption n reward daata
$sql = "SELECT base_electric, base_water, eco_points, reward_target, reward_type FROM users WHERE id = $user_id";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    
    // consumption logic 
    $live_electric = $row['base_electric'] + rand(-3, 3);
    $live_water = $row['base_water'] + rand(-3, 3);
    $elec_diff = round((($live_electric - 100) / 100) * 100);
    $water_diff = round((($live_water - 100) / 100) * 100);

    // reward logic-
    $current_points = $row['eco_points'];
    $target = $row['reward_target'];
    $type = $row['reward_type'];
    
    // calculate % (cap 100)
    $progress = ($target > 0) ? min(100, round(($current_points / $target) * 100)) : 0;
    
    
    $reward_name = ($type == 0) ? "15% Off Fooyo Voucher" : "15% Off CU Mart Discount";

    echo json_encode([
        "status" => "success",
        "electric" => ["value" => $live_electric, "diff" => $elec_diff],
        "water" => ["value" => $live_water, "diff" => $water_diff],
        "reward" => [
            "name" => $reward_name,
            "current" => $current_points,
            "target" => $target,
            "percent" => $progress
        ]
    ]);
} else {
    echo json_encode(["status" => "error"]);
}
$conn->close();
?>