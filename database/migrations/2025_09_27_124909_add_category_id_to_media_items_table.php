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
            // Füge category_id Spalte hinzu
            $table->unsignedBigInteger('category_id')->nullable()->after('id');
            
            // Füge Foreign Key Constraint hinzu
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            
            // Füge Index hinzu
            $table->index('category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_items', function (Blueprint $table) {
            // Entferne Foreign Key Constraint
            $table->dropForeign(['category_id']);
            
            // Entferne Index
            $table->dropIndex(['category_id']);
            
            // Entferne Spalte
            $table->dropColumn('category_id');
        });
    }
};
