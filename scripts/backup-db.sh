#!/usr/bin/env bash
# ==============================================================================
# KEKEGO — Automated Database Backup Script (PostgreSQL + PostGIS)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/kekego_backup_${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Default connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-kekego}"
DB_NAME="${DB_NAME:-kekego}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting Kekego database backup..." | tee -a "${LOG_FILE}"
echo "[$(date)] Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}" | tee -a "${LOG_FILE}"

# Execute pg_dump with custom format and high compression
PGPASSWORD="${DB_PASSWORD:-kekego_secret}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}" 2>> "${LOG_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} (Size: ${BACKUP_SIZE})" | tee -a "${LOG_FILE}"

# Retention management: Prune backups older than RETENTION_DAYS
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..." | tee -a "${LOG_FILE}"
find "${BACKUP_DIR}" -name "kekego_backup_*.dump" -mtime +"${RETENTION_DAYS}" -exec rm {} \; 2>/dev/null || true

echo "[$(date)] Backup procedure finished cleanly." | tee -a "${LOG_FILE}"
