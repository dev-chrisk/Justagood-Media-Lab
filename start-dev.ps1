# Media Library Development Environment - PowerShell Script
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Media Library Development Environment" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Blue

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check PHP
if (Test-Command "php") {
    $phpVersion = php --version | Select-Object -First 1
    Write-Host "✓ $phpVersion found" -ForegroundColor Green
} else {
    Write-Host "ERROR: PHP is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PHP and add it to your PATH" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Composer
if (Test-Command "composer") {
    $composerVersion = composer --version | Select-Object -First 1
    Write-Host "✓ $composerVersion found" -ForegroundColor Green
} else {
    Write-Host "WARNING: Composer not found. Some Laravel features might not work." -ForegroundColor Yellow
}

Write-Host ""

# Start Laravel Backend
Write-Host "Starting Laravel Backend on http://127.0.0.1:8050..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    php artisan serve --host=127.0.0.1 --port=8050
}

# Wait for Laravel to start
Write-Host "Waiting for Laravel to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if Laravel is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8050" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Laravel Backend is running on http://127.0.0.1:8050" -ForegroundColor Green
} catch {
    Write-Host "⚠ Laravel Backend might still be starting..." -ForegroundColor Yellow
}

Write-Host ""

# Start Vue.js Frontend
Write-Host "Starting Vue.js Frontend..." -ForegroundColor Blue

# Navigate to frontend directory
Set-Location "frontend-vue"

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found in frontend-vue directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install npm dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
}

Write-Host "✓ Starting Vue.js development server..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Development Environment Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Backend:  http://127.0.0.1:8050" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C to stop the frontend server" -ForegroundColor Cyan
Write-Host "Press any key to close this window" -ForegroundColor Cyan
Write-Host ""

# Start npm run dev
npm run dev

# Cleanup
Write-Host ""
Write-Host "Stopping backend..." -ForegroundColor Yellow
Stop-Job $backendJob
Remove-Job $backendJob

Write-Host "Development environment stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
