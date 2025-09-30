<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category', // Legacy field - wird für Migration beibehalten
        'category_id', // Neue Beziehung zur categories Tabelle
        'watchlist_type', // Type für Watchlist-Items (game, series, movie)
        'release',
        'rating',
        'count',
        'platforms',
        'genre',
        'link',
        'path',
        'discovered',
        'spielzeit',
        'is_airing',
        'next_season',
        'next_season_release',
        'external_id',
        'user_id',
    ];

    protected $casts = [
        'discovered' => 'date',
        'next_season_release' => 'date',
        'is_airing' => 'boolean',
        'rating' => 'integer',
        'count' => 'integer',
        'spielzeit' => 'integer',
        'next_season' => 'integer',
    ];

    protected $appends = ['image_url', 'category_name'];

    // Accessor for image URL
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->path ? asset('storage/' . $this->path) : null,
        );
    }

    // Accessor for category name (backward compatibility)
    protected function categoryName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->category ?: ($this->categoryRelation ? $this->categoryRelation->name : null),
        );
    }

    // Scope for filtering by category (legacy support)
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    // Scope for filtering by category ID
    public function scopeCategoryId($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // Scope for filtering by category name (through relationship)
    public function scopeCategoryName($query, $categoryName)
    {
        return $query->whereHas('categoryRelation', function ($q) use ($categoryName) {
            $q->where('name', $categoryName);
        });
    }

    // Scope for searching by title
    public function scopeSearch($query, $search)
    {
        return $query->where('title', 'like', "%{$search}%");
    }

    // Scope for filtering by rating range
    public function scopeRatingRange($query, $min, $max)
    {
        return $query->whereBetween('rating', [$min, $max]);
    }

    // Scope for filtering by playtime range
    public function scopePlaytimeRange($query, $min, $max)
    {
        return $query->whereBetween('spielzeit', [$min, $max]);
    }

    // Relationship to User
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relationship to Category
    public function categoryRelation(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    // Scope for filtering by user
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Set category by name (creates category if it doesn't exist)
     */
    public function setCategoryByName($categoryName)
    {
        if (empty($categoryName)) {
            $this->category_id = null;
            $this->category = null;
            return;
        }

        $category = Category::findOrCreateByName($categoryName);
        $this->category_id = $category->id;
        $this->category = $categoryName; // Legacy field
    }

    /**
     * Get category name (with fallback to legacy field)
     */
    public function getCategoryNameAttribute()
    {
        if ($this->categoryRelation) {
            return $this->categoryRelation->name;
        }
        return $this->category;
    }

    /**
     * Boot method to handle category assignment
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($mediaItem) {
            // Wenn category gesetzt ist aber nicht category_id, finde oder erstelle die Kategorie
            if ($mediaItem->category && !$mediaItem->category_id) {
                $category = Category::findOrCreateByName($mediaItem->category);
                $mediaItem->category_id = $category->id;
            }
        });
    }
}
