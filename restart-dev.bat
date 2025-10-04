@echo off
echo ========================================
echo Restarting Development Environment
echo ========================================

REM Check if PHP artisan serve is running and kill it
echo Checking for running PHP artisan serve...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Found process on port 8000 with PID %%a
    taskkill /PID %%a /F
    echo Killed PHP artisan serve process
)

REM Wait a moment for the process to fully terminate
timeout /t 2 /nobreak >nul

REM Navigate to frontend-vue and build
echo.
echo Building frontend...
cd frontend-vue
call npm run build

REM Check if build was successful
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Frontend build completed successfully!

REM Go back to root directory
cd ..

REM Start PHP artisan serve
echo.
echo Starting PHP artisan serve...
php artisan serve

pause

