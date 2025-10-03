<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BooksCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Füge die Bücher-Kategorie hinzu, falls sie noch nicht existiert
        \DB::table('categories')->updateOrInsert(
            ['name' => 'Bücher'],
            [
                'name' => 'Bücher',
                'slug' => 'buecher',
                'description' => 'Bücher und Literatur',
                'color' => '#8B4513',
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
