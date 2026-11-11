<#
.SYNOPSIS
  KEKEGO — Automated Database Backup Script (PowerShell / Windows)
.DESCRIPTION
  Performs compressed pg_dump of the PostgreSQL + PostGIS database with retention pruning.
#>

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "kekego",
    [string]$DbName = "kekego",
    [string]$DbPassword = "kekego_secret",
    [string]$BackupDir = "./backups",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "kekego_backup_$Timestamp.dump"
$LogFile = Join-Path $BackupDir "backup_$Timestamp.log"

Write-Host "[$((Get-Date).ToString())] Starting Kekego database backup..." -ForegroundColor Cyan
Write-Host "[$((Get-Date).ToString())] Target: ${DbUser}@${DbHost}:${DbPort}/${DbName}" -ForegroundColor Gray

$env:PGPASSWORD = $DbPassword

try {
    $pgDumpArgs = @(
        "-h", $DbHost,
        "-p", $DbPort,
        "-U", $DbUser,
        "-d", $DbName,
        "-F", "c",
        "-b",
        "-v",
        "-f", $BackupFile
    )

    & pg_dump $pgDumpArgs 2>&1 | Tee-Object -FilePath $LogFile

    if (Test-Path $BackupFile) {
        $fileSize = (Get-Item $BackupFile).Length / 1MB
        Write-Host "[$((Get-Date).ToString())] Backup created successfully: $BackupFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
    }
}
catch {
    Write-Error "Backup failed: $_"
}
finally {
    $env:PGPASSWORD = $null
}

# Retention cleanup
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "kekego_backup_*.dump" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
Write-Host "[$((Get-Date).ToString())] Backup procedure completed." -ForegroundColor Cyan
