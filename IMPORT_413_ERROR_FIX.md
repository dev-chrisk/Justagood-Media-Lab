# Import 413 Error Fix Documentation

## Problem Description

The import functionality was failing on the production server with a 413 error (Request Entity Too Large) and a JavaScript error "body stream already read". This occurred because:

1. **413 Error**: The server was rejecting large file uploads due to PHP/Apache configuration limits
2. **JavaScript Error**: The error handling code was trying to read the response body twice (first as JSON, then as text)

## Solutions Implemented

### 1. JavaScript Error Handling Fix

**File**: `public/frontend/scripts/script.js`

- Fixed the "body stream already read" error by using `response.clone()` before attempting to read the response as JSON
- Added specific handling for 413 status code with user-friendly German error message
- Improved error handling to prevent multiple response body reads

### 2. Chunked Upload Implementation

**Files**: `public/frontend/scripts/script.js`, `app/Http/Controllers/ExportImportController.php`, `routes/api.php`

- **Automatic Detection**: Files larger than 50MB automatically use chunked upload
- **Chunked Upload Process**: Large files are split into 5MB chunks and uploaded sequentially
- **Backend Support**: New API endpoints `/api/upload-chunk` and `/api/finalize-chunked-upload`
- **Progress Tracking**: Real-time progress updates during chunked upload
- **Error Recovery**: Individual chunk failures can be retried

### 3. Apache Configuration (.htaccess)

**File**: `public/.htaccess`

Added PHP configuration directives to increase file upload limits:
```apache
# Increase file upload limits for import functionality
<IfModule mod_php.c>
    php_value upload_max_filesize 100M
    php_value post_max_size 100M
    php_value max_execution_time 300
    php_value max_input_time 300
    php_value memory_limit 256M
</IfModule>
```

### 4. PHP Configuration File

**File**: `public/php.ini`

Created a PHP configuration file with comprehensive settings for large file uploads:
- `upload_max_filesize = 100M`
- `post_max_size = 100M`
- `max_execution_time = 300`
- `max_input_time = 300`
- `memory_limit = 256M`

### 5. Laravel Validation

**File**: `app/Http/Controllers/ExportImportController.php`

Added proper validation in both `importDataStream()` and `streamImportProgress()` methods:
- File size validation (100MB maximum)
- File type validation (ZIP only)
- Proper error handling with German error messages
- Validation before processing to prevent server overload

## Server Configuration Requirements

### For Apache Servers

1. Ensure the `.htaccess` file is in the `public/` directory
2. Make sure `mod_php` is enabled
3. Verify that `.htaccess` files are allowed to override PHP settings

### For Nginx Servers

Add these directives to your Nginx configuration:
```nginx
client_max_body_size 100M;
client_body_timeout 300s;
client_header_timeout 300s;
```

### For PHP-FPM

Add these settings to your `php.ini` or pool configuration:
```ini
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
```

## Testing

To test the fix:

1. Try importing a file larger than the previous limit
2. Check that you get a proper error message instead of the 413 error
3. Verify that the JavaScript error handling works correctly
4. Test with files up to 100MB

## Troubleshooting

If you still encounter issues:

1. **Check server logs** for PHP errors
2. **Verify PHP settings** using `phpinfo()` or `php -i`
3. **Check web server configuration** (Apache/Nginx)
4. **Ensure proper file permissions** on the `public/` directory
5. **Test with smaller files first** to isolate the issue

## File Size Limits

- **Maximum file size**: 100MB (regular upload), unlimited (chunked upload)
- **Chunk size**: 5MB per chunk
- **Maximum execution time**: 5 minutes
- **Memory limit**: 256MB
- **File type**: ZIP only

## Chunked Upload Process

For files larger than 50MB, the system automatically switches to chunked upload:

1. **File Analysis**: System checks file size and determines upload method
2. **Chunk Creation**: File is split into 5MB chunks
3. **Sequential Upload**: Each chunk is uploaded individually
4. **Progress Tracking**: Real-time progress updates during upload
5. **Chunk Assembly**: Server combines all chunks into the original file
6. **Import Processing**: File is processed using the standard import logic

## Benefits of Chunked Upload

- **Bypasses Server Limits**: Works around 413 errors from web server configuration
- **Better Error Handling**: Individual chunks can be retried if they fail
- **Progress Visibility**: Users can see detailed upload progress
- **Memory Efficient**: Reduces server memory usage during upload
- **Network Resilience**: Better handling of network interruptions

These limits can be adjusted in the configuration files if needed.
