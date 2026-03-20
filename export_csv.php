<?php
include 'db_connect.php';

// Force the browser to download this as a CSV file!
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="EcoStay_Monthly_Report.csv"');

// Create a file pointer connected to the output stream
$output = fopen('php://output', 'w');

// Output the column headings
fputcsv($output, array('Student Name', 'UTP Email', 'Village Block', 'Eco-Points', 'Electricity Usage (kWh)'));

// Fetch all the users, sorted by their block and then their points
$sql = "SELECT username, email, block_name, eco_points, base_electric FROM users ORDER BY block_name ASC, eco_points DESC";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    // Loop through the rows and put them into the CSV
    while ($row = $result->fetch_assoc()) {
        fputcsv($output, $row);
    }
}

fclose($output);
$conn->close();
?>