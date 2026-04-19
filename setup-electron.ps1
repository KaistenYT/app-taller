# Electron Setup Script
# Run this to set up the Electron environment

Write-Host "Setting up Electron environment..." -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "`nInstalling root dependencies..." -ForegroundColor Yellow
npm install

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
cd frontend\react\app-taller
npm install
cd ..\..\..

# Create necessary directories
Write-Host "`nCreating necessary directories..." -ForegroundColor Yellow
if (!(Test-Path "release")) {
    New-Item -ItemType Directory -Path "release" | Out-Null
    Write-Host "Created release/ directory" -ForegroundColor Green
}

# Build frontend for production
Write-Host "`nBuilding frontend for production..." -ForegroundColor Yellow
npm run build:frontend

Write-Host "`n✓ Electron setup complete!" -ForegroundColor Green
Write-Host "`nAvailable commands:" -ForegroundColor Cyan
Write-Host "  npm run electron:dev     - Run in development mode" -ForegroundColor White
Write-Host "  npm run electron:build   - Build Electron app" -ForegroundColor White
Write-Host "  npm run electron:dist    - Create distributable installers" -ForegroundColor White
Write-Host "  npm run dev              - Run web version (unchanged)" -ForegroundColor White
