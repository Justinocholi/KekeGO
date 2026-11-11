# ==============================================================================
# KEKEGO API — Multi-Stage Production Dockerfile
# Optimized for pnpm monorepo, minimal image size, and non-root execution
# ==============================================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat dumb-init
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 1: Dependencies & Build
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Build Packages + API
RUN pnpm -F @kekego/database prisma generate
RUN pnpm -F @kekego/database build
RUN pnpm -F @kekego/shared build
RUN pnpm -F @kekego/validation build
RUN pnpm -F @kekego/api build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Create unprivileged application user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 kekego

# Copy built artifacts and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Switch to unprivileged user
USER kekego

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
