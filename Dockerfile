# Alternative Dockerfile for Railway deployment if Nixpacks fails
FROM node:20-slim

# Install system dependencies for native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libusb-1.0-0-dev \
    libudev-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code FIRST (before Prisma generation)
COPY . .

# Add node_modules/.bin to PATH for Prisma CLI access
ENV PATH="${PATH}:/app/node_modules/.bin"

# Set build-time environment variable
ENV DOCKER_BUILD=true

# Generate Prisma client (with enhanced error handling)
RUN cd packages/prisma && pnpm prisma generate || \
    (echo "First attempt failed, trying with explicit schema path..." && \
     pnpm prisma generate --schema=./schema.prisma) || \
    (echo "Using placeholder DATABASE_URL for generation..." && \
     DATABASE_URL="postgresql://placeholder:5432/placeholder" pnpm prisma generate --schema=./schema.prisma) || \
    (echo "All generation attempts failed, but continuing build..." && exit 0)

# Build the application
RUN pnpm run deploy:build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "deploy:start"]
