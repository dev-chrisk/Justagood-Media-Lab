<?php
// Test script for import functionality
$zipFile = 'test_export_real.zip';

if (!file_exists($zipFile)) {
    echo "ZIP file not found: $zipFile\n";
    exit(1);
}

$ch = curl_init();
$postData = [
    'file' => new CURLFile($zipFile, 'application/zip', 'test_import.zip')
];

curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/import-data');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "Import successful!\n";
        echo "Data items: " . count($data['data']) . "\n";
        if (isset($data['preferences'])) {
            echo "Preferences restored: " . json_encode($data['preferences']) . "\n";
        }
    } else {
        echo "Import failed: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "Import failed with HTTP code: $httpCode\n";
}
?>
