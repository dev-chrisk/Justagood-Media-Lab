<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class ExportImportController extends Controller
{
    /**
     * Export all data as ZIP package
     */
    public function exportData(Request $request)
    {
        try {
            $data = $request->json()->all();
            $exportData = $data['exportData'] ?? [];
            $categoryLists = $data['categoryLists'] ?? [];
            
            // Create temporary directory for export
            $tempDir = storage_path('app/temp/export_' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            
            // Save main data file
            $dataFile = $tempDir . '/media_data.json';
            File::put($dataFile, json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            
            // Save category lists
            foreach ($categoryLists as $filename => $content) {
                $listFile = $tempDir . '/' . $filename;
                File::put($listFile, $content);
            }
            
            // Copy images if they exist
            $this->copyImagesToExport($tempDir, $exportData['data'] ?? []);
            
            // Create ZIP file using system command
            $zipPath = $tempDir . '/export.zip';
            $this->createZipArchive($tempDir, $zipPath);
            
            // Return ZIP file
            $zipContent = File::get($zipPath);
            
            // Cleanup
            File::deleteDirectory($tempDir);
            
            return response($zipContent, 200, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => 'attachment; filename="media-library-export.zip"',
                'Content-Length' => strlen($zipContent)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Import data from ZIP package
     */
    public function importData(Request $request): JsonResponse
    {
        try {
            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                throw new \Exception('Invalid file uploaded');
            }
            
            if ($file->getClientOriginalExtension() !== 'zip') {
                throw new \Exception('File must be a ZIP archive');
            }
            
            // Check if user is authenticated
            if (!$request->user()) {
                throw new \Exception('Authentication required for import');
            }
            
            // Create temporary directory for import
            $tempDir = storage_path('app/temp/import_' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            
            // Extract ZIP file
            $zipPath = $file->storeAs('temp', 'import_' . uniqid() . '.zip');
            $fullZipPath = storage_path('app/' . $zipPath);
            
            $this->extractZipArchive($fullZipPath, $tempDir);
            
            // Find and load data file
            $dataFile = $tempDir . '/media_data.json';
            if (!File::exists($dataFile)) {
                throw new \Exception('No media_data.json found in ZIP file');
            }
            
            $importData = json_decode(File::get($dataFile), true);
            
            if (!$importData || !isset($importData['data'])) {
                throw new \Exception('Invalid data format in ZIP file');
            }
            
            // Copy images if they exist
            $this->copyImagesFromImport($tempDir, $importData['data'] ?? []);
            
            // Assign user_id to all imported data
            $userId = $request->user()->id;
            $mediaData = $importData['data'] ?? [];
            
            // Add user_id to each media item
            foreach ($mediaData as &$item) {
                $item['user_id'] = $userId;
            }
            
            // Cleanup
            File::deleteDirectory($tempDir);
            File::delete($fullZipPath);
            
            return response()->json([
                'success' => true,
                'data' => $mediaData,
                'preferences' => $importData['preferences'] ?? null,
                'message' => 'Data imported successfully and assigned to your account'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Copy images to export directory
     */
    private function copyImagesToExport(string $tempDir, array $mediaData): void
    {
        $imagesDir = base_path('data/images');
        $imagesDownloadsDir = base_path('data/images_downloads');
        
        // Create images directories
        $exportImagesDir = $tempDir . '/images';
        $exportImagesDownloadsDir = $tempDir . '/images_downloads';
        File::makeDirectory($exportImagesDir, 0755, true);
        File::makeDirectory($exportImagesDownloadsDir, 0755, true);
        
        // Collect all unique image paths from media data
        $imagePaths = [];
        foreach ($mediaData as $item) {
            if (isset($item['path']) && !empty($item['path'])) {
                $imagePaths[] = $item['path'];
            }
        }
        
        // Copy only referenced images
        foreach ($imagePaths as $imagePath) {
            $sourcePath = $imagesDir . '/' . $imagePath;
            $destPath = $exportImagesDir . '/' . $imagePath;
            
            if (File::exists($sourcePath)) {
                // Create directory structure if needed
                $destDir = dirname($destPath);
                if (!File::exists($destDir)) {
                    File::makeDirectory($destDir, 0755, true);
                }
                File::copy($sourcePath, $destPath);
            }
        }
        
        // Also copy thumbnails if they exist
        foreach ($imagePaths as $imagePath) {
            $thumbnailPath = str_replace(['games/', 'movies/', 'series/'], '_thumbs/', $imagePath);
            $sourceThumbPath = $imagesDir . '/' . $thumbnailPath;
            $destThumbPath = $exportImagesDir . '/' . $thumbnailPath;
            
            if (File::exists($sourceThumbPath)) {
                $destThumbDir = dirname($destThumbPath);
                if (!File::exists($destThumbDir)) {
                    File::makeDirectory($destThumbDir, 0755, true);
                }
                File::copy($sourceThumbPath, $destThumbPath);
            }
        }
        
        // Copy downloaded images if they exist
        if (File::exists($imagesDownloadsDir)) {
            File::copyDirectory($imagesDownloadsDir, $exportImagesDownloadsDir);
        }
    }
    
    /**
     * Copy images from import directory
     */
    private function copyImagesFromImport(string $tempDir, array $mediaData = []): void
    {
        $imagesSourceDir = $tempDir . '/images';
        $imagesDownloadsSourceDir = $tempDir . '/images_downloads';
        
        $imagesDestDir = base_path('data/images');
        $imagesDownloadsDestDir = base_path('data/images_downloads');
        
        // Ensure destination directories exist
        if (!File::exists($imagesDestDir)) {
            File::makeDirectory($imagesDestDir, 0755, true);
        }
        if (!File::exists($imagesDownloadsDestDir)) {
            File::makeDirectory($imagesDownloadsDestDir, 0755, true);
        }
        
        // Copy main images directory
        if (File::exists($imagesSourceDir)) {
            File::copyDirectory($imagesSourceDir, $imagesDestDir);
        }
        
        // Copy downloaded images directory
        if (File::exists($imagesDownloadsSourceDir)) {
            File::copyDirectory($imagesDownloadsSourceDir, $imagesDownloadsDestDir);
        }
    }
    
    /**
     * Create ZIP archive using system command
     */
    private function createZipArchive(string $sourceDir, string $zipPath): void
    {
        // Try different ZIP commands based on OS
        $commands = [
            'zip -r "' . $zipPath . '" *',  // Linux/Mac
            'powershell Compress-Archive -Path "' . $sourceDir . '\*" -DestinationPath "' . $zipPath . '"',  // Windows PowerShell
            '7z a "' . $zipPath . '" "' . $sourceDir . '\*"',  // 7-Zip
        ];
        
        $success = false;
        foreach ($commands as $command) {
            $output = [];
            $returnCode = 0;
            exec($command . ' 2>&1', $output, $returnCode);
            
            if ($returnCode === 0 && File::exists($zipPath)) {
                $success = true;
                break;
            }
        }
        
        if (!$success) {
            throw new \Exception('Cannot create ZIP file. Please ensure zip, PowerShell, or 7-Zip is available.');
        }
    }
    
    /**
     * Extract ZIP archive using system command
     */
    private function extractZipArchive(string $zipPath, string $extractDir): void
    {
        // Try different extraction commands based on OS
        $commands = [
            'unzip -o "' . $zipPath . '" -d "' . $extractDir . '"',  // Linux/Mac
            'powershell Expand-Archive -Path "' . $zipPath . '" -DestinationPath "' . $extractDir . '" -Force',  // Windows PowerShell
            '7z x "' . $zipPath . '" -o"' . $extractDir . '" -y',  // 7-Zip
        ];
        
        $success = false;
        foreach ($commands as $command) {
            $output = [];
            $returnCode = 0;
            exec($command . ' 2>&1', $output, $returnCode);
            
            if ($returnCode === 0) {
                $success = true;
                break;
            }
        }
        
        if (!$success) {
            throw new \Exception('Cannot extract ZIP file. Please ensure unzip, PowerShell, or 7-Zip is available.');
        }
    }
}
