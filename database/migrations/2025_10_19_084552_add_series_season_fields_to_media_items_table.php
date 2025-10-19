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
            // TMDB integration fields
            $table->integer('tmdb_id')->nullable()->after('external_id');
            
            // Series season information
            $table->string('next_season_name')->nullable()->after('next_season_release');
            $table->date('last_air_date')->nullable()->after('next_season_release');
            $table->integer('total_seasons')->nullable()->after('last_air_date');
            $table->integer('total_episodes')->nullable()->after('total_seasons');
            $table->string('series_status')->nullable()->after('total_episodes'); // Returning Series, Ended, etc.
            $table->string('networks')->nullable()->after('series_status');
            $table->string('created_by')->nullable()->after('networks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_items', function (Blueprint $table) {
            $table->dropColumn([
                'tmdb_id',
                'next_season_name',
                'last_air_date',
                'total_seasons',
                'total_episodes',
                'series_status',
                'networks',
                'created_by'
            ]);
        });
    }
};
