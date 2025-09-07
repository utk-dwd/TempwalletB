# TempWallet Simple Architecture Guide

## 🎯 **Core Principle: KEEP IT SIMPLE**

**Golden Rule**: If you're adding complexity, you're doing it wrong. This guide helps you debug without breaking simplicity.

---

## 📁 **Directory Structure**

```
TempwalletB/
├── package.json                 # 3 SIMPLE SCRIPTS ONLY
├── pnpm-workspace.yaml         # Workspace config
├── Dockerfile.simple           # Single-stage Docker build
│
├── apps/
│   ├── backend/                # NestJS API (ESM)
│   │   ├── package.json        # 3 scripts: dev, build, start
│   │   ├── tsconfig.build.json # NodeNext ESM config
│   │   └── src/
│   │       ├── main.ts         # Entry point
│   │       ├── app.module.ts   # Main app module
│   │       ├── alchemy.service.ts    # Webhook processing
│   │       ├── auth/           # User authentication
│   │       ├── balances/       # Balance tracking
│   │       ├── iexec/          # Telegram notifications
│   │       ├── temp-wallets/   # Wallet management
│   │       ├── transactions/   # Transaction processing
│   │       ├── users/          # User management
│   │       └── webhooks/       # Alchemy webhooks
│   │
│   └── frontend/               # React + Vite (ESM)
│       ├── package.json        # 3 scripts: dev, build, preview
│       ├── vite.config.ts      # Vite configuration
│       └── src/
│           ├── App.tsx         # Main React app
│           ├── components/     # React components
│           ├── hooks/          # React hooks
│           ├── services/       # API calls
│           └── utils/          # Utilities
│
└── packages/
    ├── shared/                 # Shared types (ESM)
    │   ├── package.json        # 2 scripts: build, dev
    │   ├── tsconfig.json       # NodeNext ESM config
    │   └── src/
    │       ├── index.ts        # Main exports
    │       ├── types.ts        # TypeScript types
    │       └── networks.ts     # Network configurations
    │
    └── prisma/                 # Database (ESM)
        ├── package.json        # 2 scripts: build, dev
        ├── schema.prisma       # Database schema
        ├── tsconfig.json       # NodeNext ESM config
        └── src/
            ├── index.ts        # Prisma exports
            ├── client.ts       # Prisma client
            └── prisma.service.ts # NestJS service
```

---

## 🏗️ **Core Functions & Responsibilities**

### **Backend (apps/backend/src/)**

| Module | Function | Purpose |
|--------|----------|---------|
| `main.ts` | Bootstrap NestJS app | Entry point, starts server on port 3000 |
| `app.module.ts` | Root module | Imports all feature modules |
| `alchemy.service.ts` | Webhook processing | Receives balance updates from Alchemy |
| `auth/` | User authentication | JWT tokens, user login/signup |
| `balances/` | Balance tracking | Store and retrieve user balances |
| `iexec/` | Telegram notifications | Send messages via iExec SDK |
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
| `utils/` | Utilities | Helper functions, constants |

### **Shared (packages/shared/src/)**

| File | Function | Purpose |
|------|----------|---------|
| `index.ts` | Main exports | Re-exports all shared code |
| `types.ts` | TypeScript types | Shared interfaces and types |
| `networks.ts` | Network configs | Blockchain network configurations |

### **Prisma (packages/prisma/src/)**

| File | Function | Purpose |
|------|----------|---------|
| `index.ts` | Prisma exports | Re-exports client and services |
| `client.ts` | Database client | Prisma client instance |
| `prisma.service.ts` | NestJS service | Injectable Prisma service |

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

### **Testing Individual Packages**
```bash
cd apps/backend && pnpm run dev      # Backend only
cd apps/frontend && pnpm run dev     # Frontend only  
cd packages/shared && pnpm run build # Shared only
cd packages/prisma && pnpm run build # Prisma only
```

---

## 🏥 **Debugging Guide: KEEP IT SIMPLE**

### **Rule #1: Don't Touch Build Scripts**

**❌ NEVER DO THIS:**
- Add verification scripts
- Create complex build orchestration
- Add multiple deployment configs
- Create workspace filters with `@tempwallet/*` 
- Add prebuild/postbuild hooks
- Create custom build ordering

**✅ ALWAYS DO THIS:**
- Use `pnpm run dev` for development
- Use `pnpm run build` for production
- Keep package.json scripts to 3 max
- Use relative imports instead of workspace dependencies

### **Common Error Types & Simple Fixes**

#### **1. Module Resolution Errors (TS2307)**

**Error:** `Cannot find module '@tempwallet/shared'`

**❌ Complex Fix:** Add TypeScript project references, workspace configurations

**✅ Simple Fix:** Use relative imports
```typescript
// Instead of:
import { SupportedNetwork } from '@tempwallet/shared';

// Use:
import { SupportedNetwork } from '../../../packages/shared/dist/index.js';
```

#### **2. Build Order Issues**

**Error:** Package builds fail because dependencies aren't built

**❌ Complex Fix:** Create complex build orchestration scripts

**✅ Simple Fix:** 
```bash
# Just rebuild everything
pnpm -r build
```

#### **3. ESM Import Errors**

**Error:** `ERR_MODULE_NOT_FOUND` or extension errors

**❌ Complex Fix:** Complex module resolution configurations

**✅ Simple Fix:** Use `.js` extensions in imports
```typescript
// For local files, always use .js extension
import { MyService } from './my-service.js';
```

#### **4. Docker Build Failures**

**Error:** Docker build fails with complex errors

**❌ Complex Fix:** Multi-stage builds, complex copying

**✅ Simple Fix:** Use `Dockerfile.simple`
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json pnpm-*.yaml ./
COPY packages/*/package.json ./packages/*/
COPY apps/*/package.json ./apps/*/
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm -r build
EXPOSE 3000
CMD ["pnpm", "start"]
```

#### **5. Railway Deployment Issues**

**Error:** Railway deployment fails

**❌ Complex Fix:** Custom nixpacks.toml, railway.json configs

**✅ Simple Fix:** Let Railway auto-detect
```bash
# Railway will automatically:
# 1. Detect pnpm workspace
# 2. Run: pnpm install
# 3. Run: pnpm run build  
# 4. Run: pnpm start
```

#### **6. Vercel Frontend Issues**

**Error:** Vercel build fails

**❌ Complex Fix:** Custom build configurations

**✅ Simple Fix:** Use standard Vite settings
```json
// vercel.json (if needed)
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 🔧 **Package.json Templates**

### **Root package.json (NEVER EXCEED 5 SCRIPTS)**
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

### **Backend package.json**
```json
{
  "name": "backend",
  "type": "module",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js"
  }
}
```

### **Frontend package.json**
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

## 🚨 **Red Flags: When You're Overcomplicating**

**🚩 WARNING SIGNS:**
- More than 5 scripts in any package.json
- Creating verification scripts (verify-*.cjs)
- Adding prebuild/postbuild hooks
- Using complex workspace filters
- Creating custom build orchestration
- Adding TypeScript project references
- Multiple Docker stages
- Custom Railway/Vercel configs

**🛑 STOP AND SIMPLIFY:**
If you see any red flags above, step back and use this guide to simplify.

---

## 🎯 **Core User Flow (What Actually Matters)**

1. **User Signs Up** → Backend stores in database via Prisma
2. **Alchemy Webhook** → Backend processes balance changes  
3. **Balance Update** → Frontend displays new balance
4. **Transaction** → iExec sends Telegram notification

**That's it. Everything else is infrastructure.**

---

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

## 🎉 **Success Metrics**

**✅ You're doing it right when:**
- New developers can run `pnpm run dev` and it works
- Build process is explainable in one sentence
- No custom verification scripts needed
- Deployments work on first try
- Adding features doesn't require build changes

**❌ You're overcomplicating when:**
- Need multiple commands to start development
- Build process requires documentation
- Custom scripts for "fixing" builds
- Deployment requires custom configurations
- New features break existing builds

---

## 🚀 **Final Reminder**

**The goal is a working prototype, not enterprise architecture.**

- **Don't** optimize for theoretical scale
- **Don't** add tools "just in case"  
- **Don't** create custom solutions for standard problems
- **Do** keep it simple and working
- **Do** add complexity only when proven necessary
- **Do** prioritize shipping over perfect architecture

**If it builds and deploys reliably, you're done. Ship it!** 🚀
