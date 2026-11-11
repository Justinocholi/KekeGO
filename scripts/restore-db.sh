#!/usr/bin/env bash
# ==============================================================================
# KEKEGO — Automated Database Restore Script (PostgreSQL + PostGIS)
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"

if [[ -z "${BACKUP_FILE}" || ! -f "${BACKUP_FILE}" ]]; then
  echo "Usage: $0 <path_to_backup.dump> [--force]"
  echo "Error: Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

FORCE="${2:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-kekego}"
DB_NAME="${DB_NAME:-kekego}"

if [[ "${FORCE}" != "--force" ]]; then
  read -p "WARNING: Restoring will overwrite existing tables in ${DB_NAME}. Proceed? [y/N]: " CONFIRM
  if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
    echo "Restore aborted by operator."
    exit 0
  fi
fi

echo "[$(date)] Restoring database from ${BACKUP_FILE}..."

PGPASSWORD="${DB_PASSWORD:-kekego_secret}" pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -v "${BACKUP_FILE}" || true

echo "[$(date)] Database restored successfully. Verifying core tables..."

PGPASSWORD="${DB_PASSWORD:-kekego_secret}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -c "SELECT 'users' as tbl, count(*) FROM users UNION ALL SELECT 'rides', count(*) FROM rides UNION ALL SELECT 'payments', count(*) FROM payment_records UNION ALL SELECT 'service_areas', count(*) FROM service_areas;"

echo "[$(date)] Verification finished."
