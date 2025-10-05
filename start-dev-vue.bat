@echo off
echo ========================================
echo Starting Development Environment with Vue Hot Reload
echo ========================================

REM Check if PHP artisan serve is running and kill it
echo Checking for running PHP artisan serve...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Found process on port 8000 with PID %%a
    taskkill /PID %%a /F
    echo Killed PHP artisan serve process
)

REM Check if Vue dev server is running and kill it
echo Checking for running Vue dev server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo Found process on port 5173 with PID %%a
    taskkill /PID %%a /F
    echo Killed Vue dev server process
)

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Start PHP artisan serve in background
echo.
echo Starting PHP artisan serve...
start "Laravel Server" cmd /k "php artisan serve"

REM Wait a moment for Laravel to start
timeout /t 3 /nobreak >nul

REM Navigate to frontend-vue and start dev server
echo.
echo Starting Vue development server with hot reload...
cd frontend-vue
start "Vue Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Development Environment Started!
echo ========================================
echo Laravel Server: http://localhost:8000
echo Vue Dev Server: http://localhost:5173
echo.
echo Both servers are running in separate windows.
echo Vue changes will be visible instantly with hot reload.
echo.
echo Press any key to close this window...
pause >nul

