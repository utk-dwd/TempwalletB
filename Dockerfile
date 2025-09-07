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

# Copy source code
COPY . .

# Build the application
RUN pnpm run deploy:build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "deploy:start"]
