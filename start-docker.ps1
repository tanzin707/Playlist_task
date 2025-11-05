# Quick Start Script for Docker
# This script will start the project with Docker

Write-Host "`n=== Starting Collaborative Playlist Manager ===" -ForegroundColor Cyan
Write-Host ""

# Check Docker status first
Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n✗ ERROR: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Open Docker Desktop" -ForegroundColor White
    Write-Host "2. Wait for it to fully start (whale icon should be stable)" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ Docker is running!" -ForegroundColor Green
Write-Host ""

# Start the project
Write-Host "Building and starting containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
Write-Host ""

docker compose up --build


