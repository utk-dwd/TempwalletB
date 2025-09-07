# Simplified single-stage Dockerfile for testing
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libusb-1.0-0-dev \
    libudev-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace manifests
COPY packages/prisma/package.json packages/prisma/
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set build environment
ENV DOCKER_BUILD=true
ENV DATABASE_URL="postgresql://user:pass@nonexistent:5432/db"

# Generate Prisma client
RUN pnpm run prisma:generate

# Build the application
RUN pnpm run deploy:build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "deploy:start"]
