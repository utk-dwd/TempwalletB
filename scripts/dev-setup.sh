#!/bin/bash

echo "🚀 Setting up TempWallet development environment..."

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker compose down

# Remove the old container if it exists
docker rm tempwallet-db 2>/dev/null || true

# Start the database
echo "🗄️ Starting PostgreSQL database..."
docker compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Database is ready!"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate --schema=packages/prisma/schema.prisma

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy --schema=packages/prisma/schema.prisma

echo "🎉 Setup complete! You can now run:"
echo "  - Backend: pnpm --filter ./apps/backend dev"
echo "  - Frontend: pnpm --filter ./apps/frontend dev"
echo "  - Stop DB: docker compose down"
echo "  - View DB: http://localhost:5050 (admin@tempwallet.com / admin)"