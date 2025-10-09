<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

try {
    echo "Checking database connection...\n";
    
    // Test database connection
    DB::connection()->getPdo();
    echo "Database connected successfully!\n\n";
    
    // Check existing users
    echo "Current users in database:\n";
    $users = User::all();
    
    if ($users->count() > 0) {
        foreach ($users as $user) {
            echo "- ID: {$user->id}, Name: {$user->name}, Email: {$user->email}, Username: {$user->username}\n";
        }
        
        echo "\nDeleting all users...\n";
        User::truncate();
        echo "All users deleted successfully!\n";
    } else {
        echo "No users found in database.\n";
    }
    
    // Create new user
    echo "\nCreating new user...\n";
    $newUser = User::create([
        'name' => 'Admin User',
        'username' => 'admin',
        'email' => 'admin@example.com',
        'password' => Hash::make('password123')
    ]);
    
    echo "New user created successfully!\n";
    echo "- ID: {$newUser->id}\n";
    echo "- Name: {$newUser->name}\n";
    echo "- Username: {$newUser->username}\n";
    echo "- Email: {$newUser->email}\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}


