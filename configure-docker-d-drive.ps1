# Configure Docker Desktop to Use D: Drive
# This script provides instructions and checks Docker configuration

Write-Host "`n=== Docker Desktop Configuration Guide ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "To configure Docker Desktop to store ALL data on D: drive:" -ForegroundColor Yellow
Write-Host ""
Write-Host "STEP 1: Open Docker Desktop" -ForegroundColor White
Write-Host "  - Look for the Docker whale icon in your system tray" -ForegroundColor Gray
Write-Host "  - Click on it and select 'Settings' (gear icon)" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 2: Navigate to Resources" -ForegroundColor White
Write-Host "  - Click on 'Resources' in the left sidebar" -ForegroundColor Gray
Write-Host "  - Then click on 'Advanced'" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 3: Change Disk Image Location" -ForegroundColor White
Write-Host "  - Find 'Disk image location' section" -ForegroundColor Gray
Write-Host "  - Click 'Browse' or type: D:\docker-data" -ForegroundColor Gray
Write-Host "  - Click 'Apply & Restart'" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 4: Wait for Docker to Restart" -ForegroundColor White
Write-Host "  - Docker Desktop will restart automatically" -ForegroundColor Gray
Write-Host "  - Wait until the whale icon is stable (not animating)" -ForegroundColor Gray
Write-Host "  - This may take 2-5 minutes" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Current Docker Status ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker Desktop Status: RUNNING" -ForegroundColor Green
    
    # Try to get Docker root directory
    $dockerRoot = docker info --format '{{.DockerRootDir}}' 2>$null
    if ($dockerRoot) {
        Write-Host "Docker Root Directory: $dockerRoot" -ForegroundColor Cyan
        
        # Check if it's on D: drive
        if ($dockerRoot -match 'D:|d:') {
            Write-Host "Status: Docker is configured to use D: drive!" -ForegroundColor Green
        } else {
            Write-Host "Status: Docker is NOT using D: drive yet" -ForegroundColor Yellow
            Write-Host "Please follow the steps above to configure Docker Desktop" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Docker Desktop Status: NOT RUNNING" -ForegroundColor Red
    Write-Host "Please start Docker Desktop first, then run this script again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Project-Specific Configuration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "The docker-compose.yml is already configured to use:" -ForegroundColor Yellow
Write-Host "  Database Volume: D:\docker-data\collaborative-playlist\db" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once Docker Desktop is configured to use D: drive," -ForegroundColor Yellow
Write-Host "all containers and volumes will be stored there automatically." -ForegroundColor Yellow
Write-Host ""

