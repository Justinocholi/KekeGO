# Kekego Monorepo

> On-demand commercial tricycle (Keke Napep) hailing, charter, and delivery platform for the Nigerian market, starting in Nasarawa State.

## Monorepo Architecture

```text
kekego/
├── apps/
│   ├── api/            # Fastify + TypeScript backend modular monolith (REST + Socket.IO)
│   ├── admin/          # Next.js 14 back-office administration portal
│   ├── passenger/      # React Native / Expo passenger mobile & PWA application
│   └── driver/         # React Native / Expo driver partner mobile & PWA cockpit
│
├── packages/
│   ├── shared/         # Shared domain models, brand design tokens, enums, DTOs
│   ├── validation/     # Shared Zod validation schemas
│   ├── database/       # Prisma schema, migrations, PostGIS client utilities
│   └── config/         # Shared TypeScript, ESLint, and Prettier configurations
│
├── infrastructure/     # Deployment configurations & geofence spatial definitions
├── docs/               # System design specifications & ADRs
└── package.json        # Root pnpm workspaces configuration
```

## Quick Start

### Prerequisites
- Node.js >= 20 (v22.14.0 recommended)
- pnpm >= 9 (v10.33.0 recommended)
- PostgreSQL with PostGIS (for Phase 2+)
- Redis (for Phase 8+)

### Setup
```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Typecheck all packages and apps
pnpm typecheck

# Lint all packages and apps
pnpm lint

# Start API in development mode
pnpm --filter @kekego/api dev
```

## Available Scripts
- `pnpm dev`: Runs development servers concurrently.
- `pnpm build`: Builds all apps and packages.
- `pnpm lint`: Lints all code in the workspace.
- `pnpm typecheck`: Runs strict TypeScript type-checking across all packages.
- `pnpm test`: Runs test suites.
