<?php
// Test script for export functionality
$testData = [
    'exportData' => [
        'version' => '1.0',
        'timestamp' => date('c'),
        'data' => [
            [
                'id' => 'test1',
                'title' => 'A Link to the Past',
                'path' => 'games/a link to the past.jpg',
                'category' => 'game',
                'rating' => 9,
                'platforms' => 'SNES, GBA',
                'genre' => 'Action RPG'
            ],
            [
                'id' => 'test2', 
                'title' => 'Alice: Madness Returns',
                'path' => 'games/alice madness returns.jpg',
                'category' => 'game',
                'rating' => 7,
                'platforms' => 'PC, PS3, Xbox 360',
                'genre' => 'Action Adventure'
            ]
        ],
        'preferences' => [
            'animation' => '1',
            'showImages' => true,
            'showRatings' => true,
            'showPlatforms' => true,
            'showGenres' => true,
            'landscapeMode' => false,
            'gridColumns' => 10
        ]
    ],
    'categoryLists' => [
        'game_list.txt' => "A Link to the Past\nAlice: Madness Returns"
    ]
];

$jsonData = json_encode($testData);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/export-data');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    file_put_contents('test_export_real.zip', $response);
    echo "Export successful! File saved as test_export_real.zip\n";
} else {
    echo "Export failed with HTTP code: $httpCode\n";
    echo "Response: $response\n";
}
?>
