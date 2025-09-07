# Temp Wallet dApp

A decentralized application (dApp) for creating and managing deterministic ERC-4337 smart wallets on the Avalanche chain using the Biconomy Smart Account SDK. The dApp supports gasless transactions, MetaMask authentication, encrypted localStorage, and export/import functionality for wallet data.

## Project Setup

### Prerequisites
- Node.js (v18 or later)
- pnpm (`npm install -g pnpm`)
- MetaMask browser extension

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/temp-wallet.git
   cd temp-wallet

   
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build shared packages:
   ```bash
   pnpm run build:shared
   ```

### Development

1. Start development servers:
   ```bash
   pnpm run dev
   ```
   This will start both frontend (port 5173) and backend (port 3000) in watch mode.

2. Or start individually:
   ```bash
   # Frontend only
   pnpm run frontend:dev
   
   # Backend only  
   pnpm run backend:dev
   ```

### Build for Production

```bash
# Build all packages
pnpm run build:all

# Build for deployment
pnpm run build:frontend:deploy  # Frontend deployment
pnpm run build:backend:deploy   # Backend deployment
```

### Verification

Before deployment, verify builds are working:

```bash
# Check if shared package is built
pnpm run verify:shared

# Check all packages are built  
pnpm run verify:all

# Run comprehensive smoke test
pnpm run smoke:test
```

### Troubleshooting

**TS2307 Error: "Cannot find module '@tempwallet/shared'"**
1. Ensure shared package is built: `pnpm run build:shared`
2. Check if dist files exist: `ls packages/shared/dist/`
3. Clean and rebuild: `pnpm -r clean && pnpm run deploy:build`

**Build script ignored**
- Check `.pnpmrc` has `ignore-scripts=false`
- Check `.npmrc` has `ignore-scripts=false`

### Project Structure

This is a monorepo with the following packages:
- `apps/frontend`: React + Vite frontend application
- `apps/backend`: NestJS backend API  
- `packages/shared`: Shared TypeScript types and utilities
- `packages/prisma`: Database schema and Prisma client

### Deployment

The project is configured for deployment on:
- **Frontend**: Vercel
- **Backend**: Railway with Nixpacks

Build commands are pre-configured in respective `vercel.json` and `nixpacks.toml` files.
