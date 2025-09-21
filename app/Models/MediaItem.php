<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MediaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
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

    // Accessor for image URL
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->path ? asset('storage/' . $this->path) : null,
        );
    }

    // Scope for filtering by category
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
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
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scope for filtering by user
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
