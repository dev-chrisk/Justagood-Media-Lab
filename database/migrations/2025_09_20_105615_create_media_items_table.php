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
        Schema::create('media_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category'); // game, series, movie, games_new, series_new, movie_new
            $table->string('release')->nullable();
            $table->integer('rating')->nullable();
            $table->integer('count')->default(0);
            $table->string('platforms')->nullable();
            $table->text('genre')->nullable();
            $table->string('link')->nullable();
            $table->string('path')->nullable(); // image path
            $table->date('discovered')->nullable();
            $table->integer('spielzeit')->nullable(); // playtime in minutes
            $table->boolean('is_airing')->default(false);
            $table->integer('next_season')->nullable();
            $table->date('next_season_release')->nullable();
            $table->string('external_id')->nullable(); // for API integration
            $table->timestamps();
            
            // Indexes for better performance
            $table->index('category');
            $table->index('title');
            $table->index('rating');
            $table->index('release');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_items');
    }
};
