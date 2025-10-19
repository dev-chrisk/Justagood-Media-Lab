<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('media_items', function (Blueprint $table) {
            // Add new watchlist types for series
            $table->string('watchlist_series_type')->nullable()->after('watchlist_type');
            $table->integer('watchlist_original_series_id')->nullable()->after('watchlist_series_type');
            $table->string('watchlist_season_info')->nullable()->after('watchlist_original_series_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_items', function (Blueprint $table) {
            $table->dropColumn([
                'watchlist_series_type',
                'watchlist_original_series_id',
                'watchlist_season_info'
            ]);
        });
    }
};
