<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CollectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Collection::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $collections = $query->get();
        return response()->json(['collections' => $collections]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'media_item_ids' => 'nullable|array',
            'media_item_ids.*' => 'integer|exists:media_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $data = $request->all();
        // Add user_id if user is authenticated
        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $collection = Collection::create($data);

        return response()->json(['success' => true, 'data' => $collection], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $query = Collection::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $collection = $query->find($id);

        if (!$collection) {
            return response()->json(['success' => false, 'error' => 'Collection not found'], 404);
        }

        return response()->json($collection);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $query = Collection::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $collection = $query->find($id);

        if (!$collection) {
            return response()->json(['success' => false, 'error' => 'Collection not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'media_item_ids' => 'nullable|array',
            'media_item_ids.*' => 'integer|exists:media_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $collection->update($request->all());

        return response()->json(['success' => true, 'data' => $collection]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $query = Collection::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $collection = $query->find($id);

        if (!$collection) {
            return response()->json(['success' => false, 'error' => 'Collection not found'], 404);
        }

        $collection->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Save collections (for compatibility with existing frontend)
     */
    public function saveCollections(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'collections' => 'required|array',
            'collections.*.name' => 'required|string|max:255',
            'collections.*.description' => 'nullable|string',
            'collections.*.media_item_ids' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        // Only clear and insert data if user is authenticated
        if ($request->user()) {
            // Clear existing collections for this user
            Collection::forUser($request->user()->id)->delete();
            
            foreach ($request->collections as $collectionData) {
                $collectionData['user_id'] = $request->user()->id;
                Collection::create($collectionData);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Add media item to collection
     */
    public function addMediaItem(Request $request, string $id): JsonResponse
    {
        $query = Collection::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $collection = $query->find($id);

        if (!$collection) {
            return response()->json(['success' => false, 'error' => 'Collection not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'media_item_id' => 'required|integer|exists:media_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $collection->addMediaItem($request->media_item_id);

        return response()->json(['success' => true, 'data' => $collection]);
    }

    /**
     * Remove media item from collection
     */
    public function removeMediaItem(Request $request, string $id): JsonResponse
    {
        $query = Collection::query();
        
        // Filter by authenticated user
        if ($request->user()) {
            $query->forUser($request->user()->id);
        }
        
        $collection = $query->find($id);

        if (!$collection) {
            return response()->json(['success' => false, 'error' => 'Collection not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'media_item_id' => 'required|integer|exists:media_items,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 400);
        }

        $collection->removeMediaItem($request->media_item_id);

        return response()->json(['success' => true, 'data' => $collection]);
    }
}
