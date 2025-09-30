@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Media Library Development Environment
echo ========================================
echo.

REM Set colors for better output
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "RESET=%ESC%[0m"

echo %BLUE%Checking prerequisites...%RESET%

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Node.js is not installed or not in PATH%RESET%
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo %GREEN%✓ Node.js %%i found%RESET%
)

REM Check if PHP is installed
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: PHP is not installed or not in PATH%RESET%
    echo Please install PHP and add it to your PATH
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('php --version ^| findstr "PHP"') do echo %GREEN%✓ %%i found%RESET%
)

REM Check if Composer is installed
composer --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%WARNING: Composer not found. Some Laravel features might not work.%RESET%
) else (
    for /f "tokens=*" %%i in ('composer --version ^| findstr "Composer"') do echo %GREEN%✓ %%i found%RESET%
)

echo.
echo %BLUE%Starting Laravel Backend on http://127.0.0.1:8050...%RESET%
start "Laravel Backend - Port 8050" cmd /k "echo Starting Laravel Backend... && php artisan serve --host=127.0.0.1 --port=8050"

REM Wait for Laravel to start
echo %YELLOW%Waiting for Laravel to initialize...%RESET%
timeout /t 5 /nobreak >nul

REM Check if Laravel is running
curl -s http://127.0.0.1:8050 >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✓ Laravel Backend is running on http://127.0.0.1:8050%RESET%
) else (
    echo %YELLOW%⚠ Laravel Backend might still be starting...%RESET%
)

echo.
echo %BLUE%Starting Vue.js Frontend...%RESET%

REM Navigate to frontend directory
cd frontend-vue

REM Check if package.json exists
if not exist "package.json" (
    echo %RED%ERROR: package.json not found in frontend-vue directory%RESET%
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo %YELLOW%Installing npm dependencies...%RESET%
    npm install
    if %errorlevel% neq 0 (
        echo %RED%ERROR: Failed to install npm dependencies%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%✓ Dependencies installed successfully%RESET%
)

echo %GREEN%✓ Starting Vue.js development server...%RESET%
echo.
echo %BLUE%========================================%RESET%
echo %GREEN%  Development Environment Started!%RESET%
echo %BLUE%========================================%RESET%
echo %YELLOW%Backend:  http://127.0.0.1:8050%RESET%
echo %YELLOW%Frontend: http://localhost:5173%RESET%
echo %BLUE%========================================%RESET%
echo.
echo Press Ctrl+C to stop the frontend server
echo Press any key to close this window
echo.

npm run dev

echo.
echo %YELLOW%Development environment stopped.%RESET%
pause
