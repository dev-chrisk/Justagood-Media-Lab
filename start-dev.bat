@echo off
echo Starting Media Library Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if PHP is installed
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PHP is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting Laravel Backend on port 8050...
start "Laravel Backend" cmd /k "php artisan serve --host=127.0.0.1 --port=8050"

REM Wait a moment for Laravel to start
timeout /t 3 /nobreak >nul

echo Starting Vue.js Frontend...
cd frontend-vue

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)

echo Starting Vue.js development server...
npm run dev

pause
