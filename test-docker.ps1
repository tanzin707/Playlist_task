# Test Docker Setup Script
# This script will test if Docker is ready and then start the project

Write-Host "`n=== Testing Docker Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1. Checking Docker Desktop status..." -ForegroundColor Yellow
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Docker is running!" -ForegroundColor Green
} else {
    Write-Host "   Docker Desktop is not running or still starting..." -ForegroundColor Red
    Write-Host "   Please ensure Docker Desktop is fully started (wait for the whale icon to be stable)" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Check current volumes
Write-Host "`n2. Checking existing volumes..." -ForegroundColor Yellow
docker volume ls --filter "name=collaborative-playlist"

# Check if containers are running
Write-Host "`n3. Checking existing containers..." -ForegroundColor Yellow
$containers = docker ps -a --filter "name=collaborative-playlist" --format "{{.Names}}"
if ($containers) {
    Write-Host "   Found existing containers:" -ForegroundColor Yellow
    $containers | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    Write-Host "   (These will be removed if you run cleanup-docker.ps1)" -ForegroundColor Gray
} else {
    Write-Host "   No existing containers found" -ForegroundColor Green
}

# Check Docker data location
Write-Host "`n4. Checking Docker data location..." -ForegroundColor Yellow
$dockerDataPath = docker info --format '{{.DockerRootDir}}' 2>$null
if ($dockerDataPath) {
    Write-Host "   Docker Root Directory: $dockerDataPath" -ForegroundColor Cyan
    if ($dockerDataPath -like "*D:*" -or $dockerDataPath -like "*d:*") {
        Write-Host "   Docker is using D: drive!" -ForegroundColor Green
    } else {
        Write-Host "   Docker is not using D: drive yet" -ForegroundColor Yellow
        Write-Host "   Please configure Docker Desktop to use D:\docker-data" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Ready to Start Project ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the project, run:" -ForegroundColor Yellow
Write-Host "  docker compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "Or run in detached mode:" -ForegroundColor Yellow
Write-Host "  docker compose up --build -d" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Green
Write-Host ""
