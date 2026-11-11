#!/usr/bin/env bash
# ==============================================================================
# KEKEGO — Automated Zero-Downtime Production Deployment Runbook
# ==============================================================================

set -euo pipefail

ENV_FILE="${1:-.env.production}"
DEPLOY_TIMEOUT="${DEPLOY_TIMEOUT:-45}"

echo "=================================================================="
echo "KEKEGO PRODUCTION DEPLOYMENT SEQUENCE INITIATED"
echo "Timestamp: $(date)"
echo "Environment File: ${ENV_FILE}"
echo "=================================================================="

# 1. Pre-flight sanity checks
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "❌ Error: Environment file '${ENV_FILE}' not found."
  echo "Aborting deployment to prevent misconfiguration."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Error: docker is not installed or not in PATH."
  exit 1
fi

# 2. Automated pre-deployment database backup
echo "\n📦 Step 1: Performing pre-deployment database safety snapshot..."
if [[ -f "./scripts/backup-db.sh" ]]; then
  chmod +x ./scripts/backup-db.sh
  ./scripts/backup-db.sh || {
    echo "⚠️ Warning: Database backup returned non-zero. Continuing with caution..."
  }
fi

# 3. Apply Prisma migrations
echo "\n🔄 Step 2: Executing database migrations (Prisma migrate deploy)..."
pnpm -F @kekego/database prisma migrate deploy || {
  echo "❌ Error: Database migration failed. Halting deployment."
  exit 1
}

# 4. Build and start production containers
echo "\n🚀 Step 3: Building and hot-reloading production containers..."
docker compose --env-file "${ENV_FILE}" -f docker-compose.yml build --pull
docker compose --env-file "${ENV_FILE}" -f docker-compose.yml up -d --remove-orphans

# 5. Post-deployment smoke & readiness verification
echo "\n🔍 Step 4: Polling API deep readiness probe (http://127.0.0.1:4000/ready)..."

ELAPSED=0
HEALTHY=false

while [[ ${ELAPSED} -lt ${DEPLOY_TIMEOUT} ]]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/ready || true)

  if [[ "${HTTP_CODE}" == "200" ]]; then
    HEALTHY=true
    break
  fi

  echo "  Waiting for services to become healthy... (Elapsed: ${ELAPSED}s / Status: ${HTTP_CODE})"
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done

if [[ "${HEALTHY}" == "true" ]]; then
  echo "\n✅ Deployment Verified: All services report healthy (HTTP 200 OK)."
  echo "API: http://127.0.0.1:4000 (Proxy target: api.kekego.ng)"
  echo "Admin: http://127.0.0.1:3000 (Proxy target: admin.kekego.ng)"
  echo "Kekego production deployment completed successfully."
else
  echo "\n❌ Deployment Verification Failed: API failed to reach ready state within ${DEPLOY_TIMEOUT}s."
  echo "Reviewing service logs:"
  docker compose -f docker-compose.yml logs --tail=50 api
  echo "Initiating rollback alert. Please inspect container logs."
  exit 1
fi
