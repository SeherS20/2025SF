<?php
// Read incoming JSON data
$data = json_decode(file_get_contents("php://input"), true);

if ($data) {
    $flowRate = $data["flowRate"];
    $totalMilliLitres = $data["totalMilliLitres"];
    $timestamp = date("Y-m-d H:i:s");

    // Save to a file (or use a database)
    file_put_contents("data.json", json_encode(["flowRate" => $flowRate, "totalMilliLitres" => $totalMilliLitres, "timestamp" => $timestamp]));

    echo "Data received successfully!";
} else {
    echo "Invalid data!";
}
?>
