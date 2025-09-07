# TempWallet Simple Architecture Guide

## 🎯 **Core Principle: ZERO WORKSPACE DEPENDENCIES**

**Golden Rule**: Maximum simplification achieved - each app builds completely independently. No workspace dependencies, no complex build orchestration.

---

## 📁 **Current Directory Structure**

```
TempwalletB/
├── package.json                 # 3 SIMPLE SCRIPTS ONLY
├── pnpm-workspace.yaml         # Workspace config (for development only)
├── pnpm-lock.yaml              # Dependency lockfile
├── Dockerfile.simple           # Single-stage Docker build
├── .gitignore                  # Git ignore rules
├── .dockerignore               # Docker ignore rules
├── SIMPLE.md                   # This guide (your north star!)
├── FAQ.md                      # Deployment troubleshooting
│
├── apps/
│   ├── backend/                # NestJS API (ESM + Zero Dependencies)
│   │   ├── package.json        # 3 scripts: dev, build, start
│   │   ├── tsconfig.json       # CommonJS for simplicity
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Local database schema
│   │   └── src/
│   │       ├── main.ts         # Entry point
│   │       ├── app.module.ts   # Main app module
│   │       ├── database/       # LOCAL Prisma setup
│   │       │   ├── prisma.service.ts
│   │       │   └── prisma.module.ts
│   │       ├── types/          # LOCAL shared types
│   │       │   ├── shared.ts   # Networks, enums, interfaces
│   │       │   └── prisma.ts   # Prisma re-exports
│   │       ├── alchemy.service.ts    # Webhook processing
│   │       ├── auth/           # User authentication
│   │       ├── balances/       # Balance tracking
│   │       ├── iexec/          # Telegram notifications (ESM required)
│   │       ├── temp-wallets/   # Wallet management
│   │       ├── transactions/   # Transaction processing
│   │       ├── users/          # User management
│   │       └── webhooks/       # Alchemy webhooks
│   │
│   └── frontend/               # React + Vite (Independent)
│       ├── package.json        # 3 scripts: dev, build, preview
│       ├── vite.config.ts      # Vite configuration
│       └── src/
│           ├── App.tsx         # Main React app
│           ├── components/     # React components
│           ├── hooks/          # React hooks
│           ├── services/       # API calls
│           ├── types/          # LOCAL TypeScript types
│           └── utils/          # Utilities
│
└── packages/                   # LEGACY - Not used by apps
    ├── shared/                 # ⚠️ DEPRECATED - Use local types
    └── prisma/                 # ⚠️ DEPRECATED - Use local setup
```

---

## 🏗️ **Core Functions & Responsibilities**

### **Backend (apps/backend/src/)**

| Module | Function | Purpose |
|--------|----------|---------|
| `main.ts` | Bootstrap NestJS app | Entry point, starts server on port 3000 |
| `app.module.ts` | Root module | Imports all feature modules |
| `database/` | **LOCAL Prisma setup** | `prisma.service.ts` + `prisma.module.ts` |
| `types/` | **LOCAL shared types** | `shared.ts` (networks/enums) + `prisma.ts` (re-exports) |
| `alchemy.service.ts` | Webhook processing | Receives balance updates from Alchemy |
| `auth/` | User authentication | JWT tokens, user login/signup |
| `balances/` | Balance tracking | Store and retrieve user balances |
| `iexec/` | Telegram notifications | Send messages via iExec SDK (ESM required) |
| `temp-wallets/` | Wallet management | Create and manage temporary wallets |
| `transactions/` | Transaction processing | Handle blockchain transactions |
| `users/` | User management | CRUD operations for users |
| `webhooks/` | Webhook endpoints | Receive external notifications |

### **Frontend (apps/frontend/src/)**

| Module | Function | Purpose |
|--------|----------|---------|
| `App.tsx` | Main React app | Root component, routing |
| `components/` | UI components | Reusable React components |
| `hooks/` | React hooks | Custom hooks for state management |
| `services/` | API calls | HTTP requests to backend |
| `types/` | **LOCAL TypeScript types** | Independent type definitions |
| `utils/` | Utilities | Helper functions, constants |

---

## 🚀 **Simple Commands**

### **Development**
```bash
cd /home/utkdwd/Code/TempwalletB
pnpm run dev        # Starts everything in parallel
```

### **Production Build**
```bash
pnpm run build      # Builds all packages
pnpm start          # Runs backend only
```

### **Testing Individual Apps (Zero Dependencies)**
```bash
cd apps/backend && pnpm run dev      # Backend only (completely independent)
cd apps/frontend && pnpm run dev     # Frontend only (completely independent)
```

---

## 🏥 **Debugging Guide: ZERO WORKSPACE DEPENDENCIES**

### **Rule #1: Each App is Completely Independent**

**✅ CURRENT ARCHITECTURE:**
- Backend has local `src/database/` for Prisma
- Backend has local `src/types/` for shared types
- Frontend has local `src/types/` for its types
- **NO** `@tempwallet/*` imports anywhere
- Each app builds without any workspace packages

**❌ NEVER GO BACK TO:**
- Workspace dependencies (`@tempwallet/shared`, `@tempwallet/prisma`)
- Complex build orchestration
- Cross-package imports

### **Current Working Import Patterns**

#### **Backend Internal Imports (with .js for ESM)**
```typescript
// ✅ Correct - Local imports with .js extension
import { SupportedNetwork } from './types/shared.js';
import { PrismaService } from './types/prisma.js';
import { AuthService } from './auth/auth.service.js';

// ✅ Correct - External packages without .js
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
```

#### **Frontend Internal Imports**
```typescript
// ✅ Correct - Local imports without .js (Vite handles it)
import { ApiService } from '../services/api';
import { UserType } from '../types/user';

// ✅ Correct - External packages
import { useState } from 'react';
```

### **Common Error Types & Simple Fixes**

#### **1. Build Errors After Changes**

**Error:** `Cannot find module './something'`

**✅ Simple Fix:**
```bash
cd apps/backend && pnpm run build  # Test backend independently
cd apps/frontend && pnpm run build # Test frontend independently
```

#### **2. ESM Import Errors**

**Error:** `Cannot find module './service.js'`

**✅ Fix:** Add `.js` extension to local TypeScript imports in backend:
```typescript
// ❌ Wrong
import { MyService } from './my-service';

// ✅ Correct
import { MyService } from './my-service.js';
```

#### **3. Accidental Workspace Dependencies**

**Error:** `Cannot find module '@tempwallet/something'`

**✅ Fix:** Use local imports instead:
```typescript
// ❌ Wrong
import { SupportedNetwork } from '@tempwallet/shared';

// ✅ Correct
import { SupportedNetwork } from './types/shared.js';
```

---

## 🔧 **Package.json Templates**

### **Root package.json (EXACTLY 3 SCRIPTS)**
```json
{
  "name": "tempwallet-simple",
  "type": "module",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build", 
    "start": "pnpm --filter backend start"
  }
}
```

### **Backend package.json (Zero Dependencies)**
```json
{
  "name": "backend",
  "type": "module",
  "scripts": {
    "dev": "nest start --watch",
    "build": "prisma generate && nest build",
    "start": "node dist/main.js"
  }
}
```

### **Frontend package.json (Independent)**
```json
{
  "name": "frontend", 
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🚨 **Red Flags: When You're Adding Complexity**

**🚩 WARNING SIGNS:**
- Adding `@tempwallet/*` imports back
- Creating new packages in `packages/`
- More than 3 scripts in any package.json
- Complex build orchestration
- TypeScript project references
- Custom build verification scripts

**🛑 STOP AND SIMPLIFY:**
If you see any red flags above, use local imports and keep each app independent.

---

## 🎯 **Core User Flow (What Actually Matters)**

1. **User Signs Up** → Backend stores in local database via local Prisma
2. **Alchemy Webhook** → Backend processes balance changes using local types  
3. **Balance Update** → Frontend displays new balance via API calls
4. **Transaction** → iExec sends Telegram notification (ESM working)

**That's it. Everything else is infrastructure that now works independently.**

---

## ✅ **Success Metrics (All Currently Working)**

**✅ You know it's working when:**
- `cd apps/backend && pnpm run build` works independently ✅
- `cd apps/frontend && pnpm run build` works independently ✅
- No `@tempwallet/*` imports anywhere ✅
- iExec SDK works (ESM compatibility) ✅
- Railway deployment works without workspace issues ✅

**❌ You've broken it when:**
- Apps can't build independently
- Workspace dependencies creep back in
- Complex build orchestration returns

**🔬 Quick Verification Commands:**
```bash
# Verify zero workspace dependencies
cd apps/backend && grep -r "@tempwallet/" src/ 
# Should return nothing

# Test independent builds
cd apps/backend && pnpm run build   # Should work alone
cd apps/frontend && pnpm run build  # Should work alone

# Verify local imports are working
cd apps/backend && grep -r "from './types/" src/
# Should show local type imports
```

---

## 🚀 **Final Reminder**

**The goal was MAXIMUM SIMPLIFICATION - and we achieved it!**

- **✅ Zero workspace dependencies** - Each app is completely independent
- **✅ ESM compatibility** - iExec SDK works perfectly
- **✅ Simple deployment** - Railway and Vercel work out of the box
- **✅ Maintainable** - New developers can understand it instantly

**If it builds independently and deploys reliably, you're done. Ship it!** 🚀

## 📝 **LLM Context Template**

**When asking for help, provide this context:**

```markdown
# TempWallet Architecture Context

## Project Type: 
Crypto wallet prototype with minimal infrastructure

## Architecture:
- ESM-first monorepo (required for iExec SDK)
- 3 simple scripts per package maximum
- No complex build orchestration
- Direct relative imports (no workspace dependencies)

## Tech Stack:
- Backend: NestJS (ESM) + Prisma + PostgreSQL
- Frontend: React + Vite (ESM) 
- Shared: TypeScript types (ESM)
- Database: Prisma schema + migrations

## Core Functions:
1. User authentication (JWT)
2. Wallet balance tracking (Alchemy webhooks)
3. Transaction processing (blockchain)
4. Telegram notifications (iExec SDK)

## Deployment:
- Backend: Railway (simple Docker)
- Frontend: Vercel (standard Vite)
- Database: Railway PostgreSQL

## Simplicity Rules:
- Max 3 scripts per package.json
- Use `pnpm -r build` for everything
- No verification scripts
- No complex configurations
- ESM with .js extensions for local imports

## Current Issue:
[Describe your specific error here]

## What I've Tried:
[List simple fixes attempted]

## Request:
Please provide the SIMPLEST solution that maintains the architecture above.
```

---