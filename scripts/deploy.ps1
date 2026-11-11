<#
.SYNOPSIS
  KEKEGO — Automated Production Deployment Script (PowerShell / Windows)
.DESCRIPTION
  Automates environment checks, database backup, Prisma migration, container rebuild, and readiness verification.
#>

param(
    [string]$EnvFile = ".env.production",
    [int]$DeployTimeout = 45
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "KEKEGO PRODUCTION DEPLOYMENT SEQUENCE INITIATED" -ForegroundColor Cyan
Write-Host "Timestamp: $((Get-Date).ToString())" -ForegroundColor Gray
Write-Host "Environment File: $EnvFile" -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Pre-flight check
if (!(Test-Path -Path $EnvFile)) {
    Write-Error "Environment file '$EnvFile' not found. Aborting deployment."
    exit 1
}

# 2. Database backup
Write-Host "`n📦 Step 1: Performing pre-deployment database safety snapshot..." -ForegroundColor Yellow
if (Test-Path -Path "scripts/backup-db.ps1") {
    try {
        & ./scripts/backup-db.ps1
    } catch {
        Write-Warning "Database backup returned warning: $_"
    }
}

# 3. Prisma migrations
Write-Host "`n🔄 Step 2: Executing database migrations..." -ForegroundColor Yellow
pnpm -F @kekego/database prisma migrate deploy

# 4. Docker compose build and restart
Write-Host "`n🚀 Step 3: Building and launching production containers..." -ForegroundColor Yellow
docker compose --env-file $EnvFile -f docker-compose.yml build --pull
docker compose --env-file $EnvFile -f docker-compose.yml up -d --remove-orphans

# 5. Readiness probe polling
Write-Host "`n🔍 Step 4: Polling API deep readiness probe (http://127.0.0.1:4000/ready)..." -ForegroundColor Yellow

$Elapsed = 0
$Healthy = $false

while ($Elapsed -lt $DeployTimeout) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:4000/ready" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.status -eq "ready") {
            $Healthy = $true
            break
        }
    } catch {
        # Retry
    }

    Write-Host "  Waiting for services to become healthy... (Elapsed: ${Elapsed}s)" -ForegroundColor Gray
    Start-Sleep -Seconds 3
    $Elapsed += 3
}

if ($Healthy) {
    Write-Host "`n✅ Deployment Verified: All services report healthy (HTTP 200 OK)." -ForegroundColor Green
    Write-Host "API: http://127.0.0.1:4000" -ForegroundColor Green
    Write-Host "Admin: http://127.0.0.1:3000" -ForegroundColor Green
} else {
    Write-Error "`n❌ Deployment Verification Failed: API failed to reach ready state within ${DeployTimeout}s."
    docker compose -f docker-compose.yml logs --tail=50 api
    exit 1
}
