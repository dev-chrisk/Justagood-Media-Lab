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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Kategoriename (eindeutig)
            $table->string('slug')->unique(); // URL-freundlicher Slug
            $table->text('description')->nullable(); // Beschreibung der Kategorie
            $table->string('color', 7)->nullable(); // Hex-Farbe für UI
            $table->boolean('is_active')->default(true); // Ob Kategorie aktiv ist
            $table->integer('sort_order')->default(0); // Sortierreihenfolge
            $table->timestamps();
            
            // Indizes für bessere Performance
            $table->index('name');
            $table->index('slug');
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
