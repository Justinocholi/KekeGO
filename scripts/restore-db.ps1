<#
.SYNOPSIS
  KEKEGO — Automated Database Restore Script (PowerShell / Windows)
.DESCRIPTION
  Restores a PostgreSQL + PostGIS database dump and executes post-restore integrity checks.
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$BackupFile,
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "kekego",
    [string]$DbName = "kekego",
    [string]$DbPassword = "kekego_secret",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -Path $BackupFile)) {
    Write-Error "Backup file does not exist: $BackupFile"
    exit 1
}

if (!$Force) {
    $confirm = Read-Host "WARNING: Restoring will overwrite existing tables in $DbName. Proceed? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "[$((Get-Date).ToString())] Restoring database from $BackupFile..." -ForegroundColor Cyan

$env:PGPASSWORD = $DbPassword

try {
    $pgRestoreArgs = @(
        "-h", $DbHost,
        "-p", $DbPort,
        "-U", $DbUser,
        "-d", $DbName,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "-v",
        $BackupFile
    )

    & pg_restore $pgRestoreArgs 2>&1 | Write-Host

    Write-Host "[$((Get-Date).ToString())] Database restored. Verifying core tables..." -ForegroundColor Green

    $verifySql = "SELECT 'users' as tbl, count(*) FROM users UNION ALL SELECT 'rides', count(*) FROM rides UNION ALL SELECT 'payments', count(*) FROM payment_records UNION ALL SELECT 'service_areas', count(*) FROM service_areas;"
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $verifySql
}
catch {
    Write-Error "Restore failed: $_"
}
finally {
    $env:PGPASSWORD = $null
}

Write-Host "[$((Get-Date).ToString())] Restore and verification completed." -ForegroundColor Cyan
