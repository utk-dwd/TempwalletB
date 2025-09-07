# TempwalletB Project Structure

This is a comprehensive directory structure for the TempwalletB project - a full-stack application with React frontend, NestJS backend, and shared TypeScript modules.

## Root Level
```
TempwalletB/
├── .env                          # Root environment variables
├── .gitignore                    # Git ignore rules for entire project
├── package.json                  # Root package.json for monorepo management
├── pnpm-lock.yaml               # PNPM lockfile for dependency management
├── pnpm-workspace.yaml          # PNPM workspace configuration
├── README.md                    # Project documentation
├── PROJECT_STRUCTURE.md         # This file - project structure documentation
├── .vscode/                     # VS Code workspace settings
│   ├── extensions.json          # Recommended VS Code extensions
│   └── settings.json            # VS Code workspace settings
├── backend/                     # NestJS backend application
├── frontend/                    # React frontend application
└── shared/                      # Shared TypeScript types and utilities
```

## Backend Directory (`/backend/`)
**Technology Stack**: NestJS, TypeScript, Prisma ORM, PostgreSQL

```
backend/
├── .env                         # Backend environment variables
├── .gitignore                   # Backend-specific gitignore
├── .prettierrc                  # Prettier configuration
├── eslint.config.mjs            # ESLint configuration
├── nest-cli.json                # NestJS CLI configuration
├── package.json                 # Backend dependencies
├── README.md                    # Backend documentation
├── tsconfig.build.json          # TypeScript build configuration
├── tsconfig.build.tsbuildinfo   # TypeScript build cache
├── tsconfig.json                # TypeScript configuration
├── prisma/                      # Database schema and ORM
│   ├── prisma.module.ts         # Prisma module for NestJS
│   ├── prisma.service.ts        # Prisma service for database operations
│   ├── schema.prisma            # Database schema definition
│   └── migrations/              # Database migration files
│       ├── migration_lock.toml  # Migration lock file
│       ├── 20250816101050_init/ # Initial migration
│       └── 20250819221710_init/ # Updated migration
├── src/                         # Source code
│   ├── app.controller.spec.ts   # App controller tests
│   ├── app.controller.ts        # Main app controller
│   ├── app.module.ts            # Main app module
│   ├── app.service.ts           # Main app service
│   ├── main.ts                  # Application entry point
│   ├── auth/                    # Authentication module
│   │   ├── auth.controller.spec.ts  # Auth controller tests
│   │   ├── auth.controller.ts       # Auth endpoints
│   │   ├── auth.module.ts           # Auth module configuration
│   │   ├── auth.service.spec.ts     # Auth service tests
│   │   ├── auth.service.ts          # Auth business logic
│   │   ├── jwt-auth.guard.ts        # JWT authentication guard
│   │   └── jwt.strategy.ts          # JWT strategy implementation
│   ├── balances/                # Balance management module
│   │   ├── balances.controller.ts   # Balance endpoints
│   │   ├── balances.module.ts       # Balance module configuration
│   │   └── balances.service.ts      # Balance business logic
│   ├── cors-proxy/              # CORS proxy module
│   │   └── cors-proxy.controller.ts # CORS proxy endpoints
│   ├── health/                  # Health check module
│   │   ├── health.controller.spec.ts # Health controller tests
│   │   └── health.controller.ts     # Health check endpoints
│   ├── temp-wallets/            # Temporary wallets module
│   │   └── temp-wallets.module.ts   # Temp wallets module configuration
│   ├── tokens/                  # Token management module
│   │   ├── tokens.controller.ts     # Token endpoints
│   │   ├── tokens.module.ts         # Token module configuration
│   │   └── tokens.service.ts        # Token business logic
│   ├── transactions/            # Transaction module
│   │   ├── transactions.controller.ts # Transaction endpoints
│   │   ├── transactions.module.ts    # Transaction module configuration
│   │   ├── transactions.service.ts   # Transaction business logic
│   │   └── dto/                     # Data Transfer Objects
│   │       └── transaction.dto.ts   # Transaction DTOs
│   ├── types/                   # TypeScript type definitions
│   │   └── express-request.d.ts     # Extended Express request types
│   ├── users/                   # User management module
│   │   ├── users.controller.ts      # User endpoints
│   │   ├── users.module.ts          # User module configuration
│   │   └── users.service.ts         # User business logic
│   └── wallets/                 # Wallet management module
│       ├── wallets.controller.ts    # Wallet endpoints
│       ├── wallets.module.ts        # Wallet module configuration
│       ├── wallets.service.ts       # Wallet business logic
│       ├── wallets.service.spec.ts  # Wallet service tests
│       └── dto/                     # Data Transfer Objects
│           └── create-wallet.dto.ts # Wallet creation DTOs
└── test/                        # End-to-end tests
    ├── app.e2e-spec.ts          # E2E test specifications
    └── jest-e2e.json            # Jest E2E configuration
```

## Frontend Directory (`/frontend/`)
**Technology Stack**: React, TypeScript, Vite, Tailwind CSS

```
frontend/
├── .env                         # Frontend environment variables
├── components.json              # UI components configuration
├── eslint.config.js             # ESLint configuration
├── index.html                   # Main HTML template
├── package.json                 # Frontend dependencies
├── server.cjs                   # Development server configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.app.json            # TypeScript app configuration
├── tsconfig.json                # TypeScript configuration
├── tsconfig.node.json           # TypeScript Node configuration
├── tsconfig.tsbuildinfo         # TypeScript build cache
├── vercel.json                  # Vercel deployment configuration
├── vite.config.ts               # Vite build tool configuration
├── api/                         # API proxy configurations
│   └── cors-proxy.ts            # CORS proxy setup
├── docs/                        # Documentation
│   └── analytics-events.md      # Analytics events documentation
├── public/                      # Static assets
│   ├── bg1.jpg                  # Background images (bg1-bg7)
│   ├── bg2.jpg
│   ├── bg3.jpg
│   ├── bg4.jpg
│   ├── bg5.jpg
│   ├── bg6.jpg
│   ├── bg7.jpg
│   ├── ethereum-eth-logo.png    # Ethereum logo
│   ├── Logo.png                 # Application logo
│   ├── TEMP Token Logo.svg      # TEMP token logo
│   ├── vite.svg                 # Vite logo
│   └── White 2000x500.png       # White background image
├── src/                         # Source code
│   ├── App.css                  # Main application styles
│   ├── App.tsx                  # Main React component
│   ├── index.css                # Global styles
│   ├── main.tsx                 # Application entry point
│   ├── testBiconomyMethods.ts   # Biconomy testing utilities
│   ├── vite-env.d.ts            # Vite environment types
│   ├── assets/                  # Static assets and images
│   ├── components/              # React components
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   ├── server/                  # Server-side utilities
│   ├── services/                # API service functions
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
└── supabase/                    # Supabase configuration
    ├── .gitignore               # Supabase gitignore
    ├── config.toml              # Supabase configuration
    ├── .branches/               # Supabase branches
    ├── .temp/                   # Temporary Supabase files
    ├── functions/               # Supabase Edge Functions
    └── migrations/              # Supabase migrations
```

## Shared Directory (`/shared/`)
**Purpose**: Shared TypeScript types and network configurations

```
shared/
├── networks.ts                  # Network configuration definitions
├── networks.d.ts                # TypeScript declarations for networks
├── networks.js                  # Compiled JavaScript for networks
├── networks.js.map              # Source map for networks
├── types.ts                     # Shared TypeScript type definitions
├── types.d.ts                   # TypeScript declarations for types
├── types.js                     # Compiled JavaScript for types
├── types.js.map                 # Source map for types
└── package.json                 # Shared module package configuration
```

## Key Features and Architecture

### Backend Features:
- **Authentication**: JWT-based authentication with MetaMask integration
- **Wallet Management**: Create, manage, and delete temporary wallets
- **Transaction Processing**: Prepare, sign, and submit blockchain transactions
- **Balance Tracking**: Real-time balance updates using Zerion API
- **Database**: PostgreSQL with Prisma ORM
- **Security**: JWT guards, CORS configuration, validation pipes

### Frontend Features:
- **Wallet Interface**: Create and manage temporary wallets
- **Transaction Flow**: Send cryptocurrency with MetaMask signing
- **Balance Display**: Real-time balance updates
- **Network Support**: Multi-chain support (Ethereum, Polygon, etc.)
- **Authentication**: MetaMask wallet connection and JWT tokens

### Shared Components:
- **Type Definitions**: Common interfaces for wallets, transactions, networks
- **Network Configurations**: Chain IDs, RPC URLs, contract addresses
- **Validation**: Shared validation schemas and enums

## Import Structure

### Backend Imports:
- Relative imports for local modules: `'../prisma/prisma.service'`
- Shared imports: `'../../shared/types'`, `'../../shared/networks'`
- External packages: `'@nestjs/common'`, `'@prisma/client'`

### Frontend Imports:
- Relative imports for components: `'./components/WalletCard'`
- Shared imports: `'../shared/types'`, `'../shared/networks'`
- External packages: `'react'`, `'ethers'`, `'viem'`

## Build Configuration

### Backend:
- **tsconfig.json**: Base TypeScript configuration
- **tsconfig.build.json**: Production build configuration
- **rootDir**: Set to `"../"` to include shared directory
- **outDir**: `"dist"` for compiled output

### Frontend:
- **Vite**: Modern build tool with hot module replacement
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS**: Utility-first CSS framework

## Build Order and Dependencies

### Build Sequence
The monorepo follows a specific build order to ensure dependencies are available:
1. **Shared Package** (`packages/shared/`): Builds first, generates TypeScript declarations
2. **Prisma Package** (`packages/prisma/`): Builds second, generates Prisma client
3. **Backend** (`apps/backend/`): Builds third, depends on shared and prisma
4. **Frontend** (`apps/frontend/`): Builds last, depends on shared

### Nix System Dependencies
For Railway/Nixpacks deployment, the following system packages are required:
- `nodejs_20`: Node.js runtime
- `pnpm-9_x`: Package manager
- `python3`: For native module compilation
- `gcc`: C compiler
- `gnumake`: Make utility
- `pkg-config`: Package configuration tool
- `libusb1`: USB library headers
- `openssl`: SSL/TLS library
- `systemd`: System and service manager (provides libudev)

### Environment Variables
- `PRISMA_SCHEMA`: Path to Prisma schema file (`packages/prisma/schema.prisma`)

## Build Order and Verification

### Build Sequence Requirements
The monorepo has strict build dependencies that must be followed:

1. **Shared Package** (`packages/shared/`): Must build first - generates TypeScript declarations
2. **Prisma Package** (`packages/prisma/`): Depends on shared - generates Prisma client
3. **Backend** (`apps/backend/`): Depends on shared + prisma - compiles NestJS application
4. **Frontend** (`apps/frontend/`): Depends on shared - builds React application

### Build Scripts
- `pnpm run build:frontend:deploy`: Builds shared → frontend
- `pnpm run build:backend:deploy`: Builds shared → prisma → backend
- `pnpm run deploy:build`: Full backend deployment build

### Verification Scripts
- `pnpm run verify:shared`: Checks if shared package is built
- `pnpm run verify:all`: Checks all packages are built
- `pnpm run smoke:test`: Comprehensive build verification

### Troubleshooting TS2307 Errors
If you encounter "Cannot find module '@tempwallet/shared'" errors:

1. **Check build order**: Ensure shared package builds before dependent packages
2. **Verify dist files**: Run `pnpm run verify:shared` to check if declarations exist
3. **Clean rebuild**: Run `pnpm -r clean && pnpm run deploy:build`
4. **Check .pnpmrc**: Ensure `ignore-scripts=false` is set

### Development Setup
1. Install dependencies: `pnpm install`
2. Build shared packages: `pnpm run build:shared`
3. Start development: `pnpm run dev`

This structure represents a well-organized monorepo with clear separation of concerns between frontend, backend, and shared code.
