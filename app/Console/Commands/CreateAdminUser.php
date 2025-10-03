<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create-user 
                            {--name=Admin} 
                            {--email=admin@teabubble.attrebi.ch} 
                            {--password=admin123} 
                            {--force}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user for the application';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $name = $this->option('name');
        $email = $this->option('email');
        $password = $this->option('password');
        $force = $this->option('force');

        // Check if user already exists
        if (User::where('email', $email)->exists() && !$force) {
            $this->error("User with email {$email} already exists!");
            $this->info('Use --force to update existing user or choose a different email.');
            return 1;
        }

        // Create or update user
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'is_admin' => true,
            ]
        );

        $this->info("✅ Admin user created/updated successfully!");
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', $user->id],
                ['Name', $user->name],
                ['Email', $user->email],
                ['Admin', $user->is_admin ? 'Yes' : 'No'],
                ['Created', $user->created_at->format('Y-m-d H:i:s')],
            ]
        );

        $this->warn("🔐 Login credentials:");
        $this->line("Email: {$email}");
        $this->line("Password: {$password}");
        $this->warn("⚠️  Please change the password after first login!");

        return 0;
    }
}
