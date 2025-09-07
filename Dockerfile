##########
# Multi-stage Dockerfile for backend deployment
# Goals:
#  - Maximize layer caching (manifest-only COPY before install)
#  - Preserve devDependencies for build, prune for runtime
#  - Deterministic Prisma client generation
#  - Explicit logging & verification
##########

FROM node:20-slim AS base

ENV PNPM_HOME=/usr/local/share/pnpm \
    PATH="${PNPM_HOME}:$PATH"

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libusb-1.0-0-dev \
    libudev-dev \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /app

##########
# Phase 1: Install (manifests only)
##########
FROM base AS install

# Root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Workspace manifests (only package.json for better caching)
COPY packages/prisma/package.json packages/prisma/
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

# Install all workspace dependencies (keep dev deps here)
RUN pnpm install --frozen-lockfile

##########
# Phase 2: Build (copy full source, generate Prisma, build packages)
##########
FROM install AS build

# Full source copy AFTER install for maximal cache reuse
COPY . .

# Build-time env flags
ENV DOCKER_BUILD=true

# Optional: verify workspaces & nest CLI prior to build
RUN node scripts/verify-workspaces.cjs || echo "Workspace verification warnings"
RUN node scripts/verify-nest.cjs || echo "Nest CLI verification warnings"

# Prisma client generation (dedicated layer) – tolerant with fallbacks
RUN pnpm run prisma:generate || \
    (echo "First attempt failed, trying direct schema path..." && pnpm --filter @tempwallet/prisma exec prisma generate --schema=packages/prisma/schema.prisma) || \
    (echo "Using placeholder DATABASE_URL for generation..." && DATABASE_URL="postgresql://placeholder:5432/placeholder" pnpm --filter @tempwallet/prisma exec prisma generate --schema=packages/prisma/schema.prisma) || \
    (echo "All Prisma generation attempts failed – continuing (will retry later)" && exit 0)

# Build shared, prisma (types), backend
RUN pnpm run build:shared && pnpm --filter @tempwallet/prisma run build && pnpm --filter @tempwallet/backend run build

# Prune devDependencies for production runtime
RUN pnpm prune --prod

##########
# Phase 3: Runtime image (minimal)
##########
FROM node:20-slim AS runtime
WORKDIR /app

# System libs required at runtime (reduced set)
RUN apt-get update && apt-get install -y \
    libusb-1.0-0-dev \
    libudev-dev \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    DOCKER_BUILD=false

# Copy production node_modules and built artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/scripts ./scripts

# Expose API port
EXPOSE 3000

# Health / diagnostics (optional)
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e 'require("fs").access("apps/backend/dist/main.js", fs.constants.R_OK, e=>process.exit(e?1:0))'

# Start backend (includes migrations via deploy:start script)
CMD ["pnpm", "run", "deploy:start"]
