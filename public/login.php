<?php
// Direct login handler to bypass Laravel server issues
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Load Laravel environment
    require_once '../vendor/autoload.php';
    $app = require_once '../bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        exit();
    }
    
    $email = $input['email'];
    
    // Find user
    $user = \App\Models\User::where('email', $email)->first();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found with this email']);
        exit();
    }
    
    // No password check - login with email only
    
    // Create token
    $token = $user->createToken('auth-token')->plainTextToken;
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'user' => $user,
        'token' => $token,
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

