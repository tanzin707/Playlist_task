# Cleanup Docker resources for collaborative-playlist project
# Run this script in PowerShell as Administrator

Write-Host "Stopping and removing containers..." -ForegroundColor Yellow
docker compose down -v 2>$null

Write-Host "Removing containers..." -ForegroundColor Yellow
$containers = docker ps -a --filter "name=collaborative-playlist" -q
if ($containers) {
    docker rm -f $containers 2>$null
}

Write-Host "Removing volumes..." -ForegroundColor Yellow
docker volume rm collaborative-playlist_backend-db 2>$null

Write-Host "Removing images..." -ForegroundColor Yellow
docker rmi collaborative-playlist-backend collaborative-playlist-frontend 2>$null

Write-Host "Cleaning up unused Docker resources..." -ForegroundColor Yellow
docker system prune -f

Write-Host "`nCleanup completed!`n" -ForegroundColor Green

Write-Host "To configure Docker Desktop to use D: drive:" -ForegroundColor Cyan
Write-Host "1. Open Docker Desktop" -ForegroundColor White
Write-Host "2. Go to Settings (gear icon)" -ForegroundColor White
Write-Host "3. Go to 'Resources' -> 'Advanced'" -ForegroundColor White
Write-Host "4. Change 'Disk image location' to: D:\docker-data" -ForegroundColor White
Write-Host "5. Click 'Apply & Restart'" -ForegroundColor White
Write-Host "`nNote: This will move all Docker data to D: drive`n" -ForegroundColor Yellow


