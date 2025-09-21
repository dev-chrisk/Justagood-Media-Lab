<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MediaItem;
use App\Models\Collection;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MigrateToLive extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:live {--backup} {--force}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate local data to live database with user assignment';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force') && !$this->confirm('This will migrate all local data to live database. Continue?')) {
            $this->info('Migration cancelled.');
            return;
        }

        $this->info('Starting live migration...');

        // Create backup if requested
        if ($this->option('backup')) {
            $this->createBackup();
        }

        // Create default user for existing data
        $defaultUser = $this->createDefaultUser();

        // Assign existing data to default user
        $this->assignDataToUser($defaultUser);

        $this->info('Live migration completed!');
        $this->info("Default user created: {$defaultUser->email}");
        $this->info('All existing data has been assigned to this user.');
    }

    private function createBackup()
    {
        $this->info('Creating database backup...');
        
        $backupFile = storage_path('app/backup_' . date('Y-m-d_H-i-s') . '.sql');
        
        // This would need to be adapted based on your database setup
        $this->warn('Please create a manual backup of your live database before proceeding.');
        $this->warn("Backup file should be saved to: {$backupFile}");
    }

    private function createDefaultUser()
    {
        $this->info('Creating default user for existing data...');

        // Check if default user already exists
        $defaultUser = User::where('email', 'admin@justagood-media-lab.local')->first();
        
        if (!$defaultUser) {
            $defaultUser = User::create([
                'name' => 'Admin User',
                'email' => 'admin@justagood-media-lab.local',
                'password' => bcrypt('admin123'), // Change this password!
                'email_verified_at' => now(),
            ]);
            
            $this->info('Default user created successfully.');
        } else {
            $this->info('Default user already exists.');
        }

        return $defaultUser;
    }

    private function assignDataToUser($user)
    {
        $this->info('Assigning existing data to user...');

        // Assign media items
        $mediaCount = MediaItem::whereNull('user_id')->count();
        if ($mediaCount > 0) {
            MediaItem::whereNull('user_id')->update(['user_id' => $user->id]);
            $this->info("Assigned {$mediaCount} media items to user.");
        }

        // Assign collections
        $collectionCount = Collection::whereNull('user_id')->count();
        if ($collectionCount > 0) {
            Collection::whereNull('user_id')->update(['user_id' => $user->id]);
            $this->info("Assigned {$collectionCount} collections to user.");
        }

        $this->info('Data assignment completed.');
    }
}