<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        // Filter by active status if requested
        if ($request->has('active_only') && $request->boolean('active_only')) {
            $query->active();
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->ordered()->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created category
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), Category::getValidationRules());

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category = Category::create($request->all());
            
            return response()->json([
                'message' => 'Category created successfully',
                'category' => $category
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified category
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json($category);
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validator = Validator::make($request->all(), Category::getValidationRules($category->id));

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $category->update($request->all());
            
            return response()->json([
                'message' => 'Category updated successfully',
                'category' => $category
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified category
     */
    public function destroy(Category $category): JsonResponse
    {
        try {
            // Check if category has media items
            if ($category->mediaItems()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete category with associated media items',
                    'media_items_count' => $category->mediaItems()->count()
                ], 422);
            }

            $category->delete();
            
            return response()->json([
                'message' => 'Category deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Find or create category by name
     */
    public function findOrCreate(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255'
        ]);

        try {
            $category = Category::findOrCreateByName($request->name, $request->only([
                'description', 'color', 'is_active', 'sort_order'
            ]));
            
            return response()->json([
                'message' => 'Category found or created successfully',
                'category' => $category
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to find or create category',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clean up duplicate categories
     */
    public function cleanupDuplicates(): JsonResponse
    {
        try {
            $beforeCount = Category::count();
            Category::cleanupDuplicates();
            $afterCount = Category::count();
            $removedCount = $beforeCount - $afterCount;
            
            return response()->json([
                'message' => 'Duplicate cleanup completed',
                'removed_duplicates' => $removedCount,
                'remaining_categories' => $afterCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cleanup duplicates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get category statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_categories' => Category::count(),
                'active_categories' => Category::active()->count(),
                'categories_with_media' => Category::whereHas('mediaItems')->count(),
                'empty_categories' => Category::whereDoesntHave('mediaItems')->count(),
            ];

            // Get categories with media item counts
            $categoriesWithCounts = Category::withCount('mediaItems')
                ->orderBy('media_items_count', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'statistics' => $stats,
                'top_categories' => $categoriesWithCounts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get category statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Migrate existing category data from media_items
     */
    public function migrateFromMediaItems(): JsonResponse
    {
        try {
            $categoryNames = Category::getUniqueCategoryNamesFromMediaItems();
            $createdCount = 0;

            foreach ($categoryNames as $categoryName) {
                if (!Category::where('name', $categoryName)->exists()) {
                    Category::create(['name' => $categoryName]);
                    $createdCount++;
                }
            }

            return response()->json([
                'message' => 'Migration completed',
                'existing_categories' => $categoryNames->count(),
                'created_categories' => $createdCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to migrate categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
