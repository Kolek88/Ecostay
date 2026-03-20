<?php
include 'db_connect.php';
header('Content-Type: application/json');

// Rank all blocks from lowest (best) to highest (worst) average electricity
$sql = "SELECT block_name, AVG(base_electric) as avg_usage 
        FROM users 
        GROUP BY block_name 
        ORDER BY avg_usage ASC";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $rank = 1;
    $messages = ["📅 Month Ended! Here are the Block rewards:"];
    
    // Loop through the ranked list and hand out points
    while ($row = $result->fetch_assoc()) {
        $block = $row['block_name'];
        
        // Determine the points based on their rank
        if ($rank === 1) {
            $points = 500;
            $messages[] = "🥇 1st Place: $block (+500 pts)";
        } elseif ($rank === 2) {
            $points = 300;
            $messages[] = "🥈 2nd Place: $block (+300 pts)";
        } elseif ($rank === 3) {
            $points = 200;
            $messages[] = "🥉 3rd Place: $block (+200 pts)";
        } else {
            $points = 50; // Everyone else gets 50 points
        }
        
        // Update the database for everyone living in this specific block
        $update_sql = "UPDATE users SET eco_points = eco_points + $points WHERE block_name = '$block'";
        $conn->query($update_sql);
        
        $rank++; // Move to the next rank position
    }
    
    $messages[] = "🎖️ All other participating blocks received +50 pts!";
    $messages[] = "♻️ Electricity meters have been reset for the new month.";

    
    // Move current data to the past, then randomize new current data
    $conn->query("UPDATE users SET prev_electric = base_electric");
    $conn->query("UPDATE users SET base_electric = FLOOR(RAND() * (150 - 60 + 1)) + 60");

    // Send the success message back to the JavaScript alert
    echo json_encode(["status" => "success", "message" => $messages]);
    
} else {
    echo json_encode(["status" => "error", "message" => "No users found in database."]);
}

$conn->close();
?>