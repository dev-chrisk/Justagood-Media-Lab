<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Boot method to automatically generate slug
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name') && empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /**
     * Get validation rules for category creation/update
     */
    public static function getValidationRules($categoryId = null)
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($categoryId),
            ],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('categories', 'slug')->ignore($categoryId),
            ],
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ];
    }

    /**
     * Relationship to MediaItems
     */
    public function mediaItems(): HasMany
    {
        return $this->hasMany(MediaItem::class);
    }

    /**
     * Scope for active categories
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for ordering by sort_order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Find or create category by name (prevents duplicates)
     */
    public static function findOrCreateByName($name, $attributes = [])
    {
        $normalizedName = trim($name);
        
        // Suche nach exakter Übereinstimmung
        $category = static::where('name', $normalizedName)->first();
        
        if ($category) {
            return $category;
        }

        // Suche nach ähnlichen Namen (case-insensitive)
        $category = static::whereRaw('LOWER(name) = LOWER(?)', [$normalizedName])->first();
        
        if ($category) {
            return $category;
        }

        // Erstelle neue Kategorie
        return static::create(array_merge([
            'name' => $normalizedName,
        ], $attributes));
    }

    /**
     * Get all unique category names from media_items table
     * (for migration purposes)
     */
    public static function getUniqueCategoryNamesFromMediaItems()
    {
        return \DB::table('media_items')
            ->select('category')
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->pluck('category')
            ->filter()
            ->values();
    }

    /**
     * Clean up duplicate categories by merging them
     */
    public static function cleanupDuplicates()
    {
        $duplicates = static::select('name', \DB::raw('COUNT(*) as count'))
            ->groupBy('name')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $duplicate) {
            $categories = static::where('name', $duplicate->name)->get();
            $keepCategory = $categories->first(); // Behalte die erste
            
            // Verschiebe alle MediaItems zur ersten Kategorie
            foreach ($categories->skip(1) as $category) {
                $category->mediaItems()->update(['category_id' => $keepCategory->id]);
                $category->delete();
            }
        }
    }
}
