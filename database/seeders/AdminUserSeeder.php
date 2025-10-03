<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::updateOrCreate(
            ['email' => 'admin@teabubble.attrebi.ch'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('admin123'),
                'is_admin' => true,
            ]
        );

        $this->command->info('✅ Admin user seeded successfully!');
        $this->command->warn('🔐 Default credentials: admin@teabubble.attrebi.ch / admin123');
        $this->command->warn('⚠️  Please change the password after first login!');
    }
}
