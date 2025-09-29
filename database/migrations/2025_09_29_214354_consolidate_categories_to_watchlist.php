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
        // 1. Erstelle die neue "Watchlist" Kategorie
        $watchlistCategory = DB::table('categories')->insertGetId([
            'name' => 'Watchlist',
            'slug' => 'watchlist',
            'description' => 'Items die noch angeschaut/gespielt werden sollen',
            'color' => '#FF6B35',
            'is_active' => true,
            'sort_order' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Finde alle "new" Kategorien
        $newCategories = DB::table('categories')
            ->whereIn('name', ['games_new', 'series_new', 'movie_new'])
            ->get();

        // 3. Verschiebe alle MediaItems von "new" Kategorien zur Watchlist
        foreach ($newCategories as $category) {
            DB::table('media_items')
                ->where('category_id', $category->id)
                ->update([
                    'category_id' => $watchlistCategory,
                    'category' => 'watchlist'
                ]);
        }

        // 4. Lösche die "new" Kategorien
        DB::table('categories')
            ->whereIn('name', ['games_new', 'series_new', 'movie_new'])
            ->delete();

        // 5. Aktualisiere die Sortierreihenfolge der verbleibenden Kategorien
        DB::table('categories')
            ->where('name', 'game')
            ->update(['sort_order' => 1]);
        
        DB::table('categories')
            ->where('name', 'series')
            ->update(['sort_order' => 2]);
        
        DB::table('categories')
            ->where('name', 'movie')
            ->update(['sort_order' => 3]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Erstelle die "new" Kategorien wieder
        $gamesNewId = DB::table('categories')->insertGetId([
            'name' => 'games_new',
            'slug' => 'games-new',
            'description' => 'Neue Spiele',
            'color' => '#4CAF50',
            'is_active' => true,
            'sort_order' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $seriesNewId = DB::table('categories')->insertGetId([
            'name' => 'series_new',
            'slug' => 'series-new',
            'description' => 'Neue Serien',
            'color' => '#2196F3',
            'is_active' => true,
            'sort_order' => 5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $movieNewId = DB::table('categories')->insertGetId([
            'name' => 'movie_new',
            'slug' => 'movie-new',
            'description' => 'Neue Filme',
            'color' => '#FF9800',
            'is_active' => true,
            'sort_order' => 6,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Verschiebe MediaItems zurück (basierend auf isNew Flag)
        $watchlistId = DB::table('categories')
            ->where('name', 'Watchlist')
            ->value('id');

        if ($watchlistId) {
            // Verschiebe Spiele zurück zu games_new
            DB::table('media_items')
                ->where('category_id', $watchlistId)
                ->where('category', 'game')
                ->update([
                    'category_id' => $gamesNewId,
                    'category' => 'games_new'
                ]);

            // Verschiebe Serien zurück zu series_new
            DB::table('media_items')
                ->where('category_id', $watchlistId)
                ->where('category', 'series')
                ->update([
                    'category_id' => $seriesNewId,
                    'category' => 'series_new'
                ]);

            // Verschiebe Filme zurück zu movie_new
            DB::table('media_items')
                ->where('category_id', $watchlistId)
                ->where('category', 'movie')
                ->update([
                    'category_id' => $movieNewId,
                    'category' => 'movie_new'
                ]);

            // Lösche die Watchlist Kategorie
            DB::table('categories')
                ->where('name', 'Watchlist')
                ->delete();
        }
    }
};
