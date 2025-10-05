<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class AddUsernameToExistingUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users without a username
        $users = User::whereNull('username')->get();
        
        foreach ($users as $user) {
            // Generate username from email (part before @)
            $username = explode('@', $user->email)[0];
            
            // Make sure username is unique
            $originalUsername = $username;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $originalUsername . $counter;
                $counter++;
            }
            
            $user->update(['username' => $username]);
            echo "Updated user {$user->name} with username: {$username}\n";
        }
    }
}
