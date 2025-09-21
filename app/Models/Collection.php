<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'media_item_ids',
        'user_id',
    ];

    protected $casts = [
        'media_item_ids' => 'array',
    ];

    // Get media items for this collection
    public function mediaItems()
    {
        return MediaItem::whereIn('id', $this->media_item_ids ?? []);
    }

    // Add media item to collection
    public function addMediaItem($mediaItemId)
    {
        $ids = $this->media_item_ids ?? [];
        if (!in_array($mediaItemId, $ids)) {
            $ids[] = $mediaItemId;
            $this->update(['media_item_ids' => $ids]);
        }
    }

    // Remove media item from collection
    public function removeMediaItem($mediaItemId)
    {
        $ids = $this->media_item_ids ?? [];
        $ids = array_values(array_filter($ids, fn($id) => $id != $mediaItemId));
        $this->update(['media_item_ids' => $ids]);
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
