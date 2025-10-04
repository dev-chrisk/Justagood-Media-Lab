<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BooksController extends Controller
{
    /**
     * Get all books for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {

        try {
            $query = MediaItem::query();

            // Filter by authenticated user
            if ($request->user()) {
                $query->forUser($request->user()->id);
            }

            // Filter by books category
            $query->where('category', 'buecher');

            $books = $query->orderBy('created_at', 'desc')->get();


            return response()->json([
                'success' => true,
                'data' => $books,
                'count' => $books->count()
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch books: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a new book
     */
    public function store(Request $request): JsonResponse
    {

        try {
            // Simple validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'author' => 'nullable|string|max:255',
                'release' => 'nullable|date',
                'rating' => 'nullable|integer|min:0|max:10',
                'count' => 'required|integer|min:0',
                'genre' => 'nullable|string',
                'link' => 'nullable|url',
                'path' => 'nullable|string',
                'discovered' => 'nullable|date',
            ]);

            if ($validator->fails()) {

                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 400);
            }

            // Prepare data
            $data = $request->all();
            $data['category'] = 'buecher'; // Force books category
            $data['user_id'] = $request->user()?->id;

            // Convert dates
            if (isset($data['release']) && is_numeric($data['release']) && strlen($data['release']) === 4) {
                $data['release'] = $data['release'] . '-01-01';
            }
            if (isset($data['discovered']) && is_numeric($data['discovered']) && strlen($data['discovered']) === 4) {
                $data['discovered'] = $data['discovered'] . '-01-01';
            }

            // Create book
            $book = MediaItem::create($data);

            return response()->json([
                'success' => true,
                'data' => $book,
                'message' => 'Book created successfully'
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Failed to create book: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a book
     */
    public function update(Request $request, $id): JsonResponse
    {

        try {
            $query = MediaItem::query();
            
            if ($request->user()) {
                $query->forUser($request->user()->id);
            }
            
            $book = $query->where('category', 'buecher')->find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'error' => 'Book not found'
                ], 404);
            }

            // Update book
            $book->update($request->all());


            return response()->json([
                'success' => true,
                'data' => $book,
                'message' => 'Book updated successfully'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Failed to update book: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a book
     */
    public function destroy(Request $request, $id): JsonResponse
    {

        try {
            $query = MediaItem::query();
            
            if ($request->user()) {
                $query->forUser($request->user()->id);
            }
            
            $book = $query->where('category', 'buecher')->find($id);

            if (!$book) {
                return response()->json([
                    'success' => false,
                    'error' => 'Book not found'
                ], 404);
            }

            $book->delete();


            return response()->json([
                'success' => true,
                'message' => 'Book deleted successfully'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Failed to delete book: ' . $e->getMessage()
            ], 500);
        }
    }
}


