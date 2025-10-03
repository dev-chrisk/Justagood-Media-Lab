<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Füge die Bücher-Kategorie zur categories Tabelle hinzu
        DB::table('categories')->insert([
            'name' => 'Bücher',
            'slug' => 'buecher',
            'description' => 'Bücher und Literatur',
            'color' => '#8B4513',
            'is_active' => true,
            'sort_order' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Entferne die Bücher-Kategorie
        DB::table('categories')->where('name', 'Bücher')->delete();
    }
};
