# TempWallet FAQ - Production Deployment Guide

## 📋 **Quick Answers to Common Questions**

### **1. Is my codebase ready for ESM modules?**

✅ **YES - 100% ESM Ready!**

**Evidence:**
- All `package.json` files have `"type": "module"`
- All TypeScript configs use `"moduleResolution": "NodeNext"`
- All imports use `.js` extensions for local files
- No CommonJS (`require()`) statements found
- Alchemy SDK, iExec SDK, and all dependencies are ESM compatible

**Final Check:**
```bash
# This should build without ESM errors
pnpm run build
```

---

### **2. Railway Deployment Process - What Happens & Where Errors Occur**

**🚀 Railway Auto-Detection Process:**

1. **Project Detection** (30 seconds)
   - Railway scans for `package.json` and `pnpm-workspace.yaml`
   - Detects pnpm monorepo structure
   - **Error Point**: If workspace config is malformed

2. **Dependency Installation** (2-3 minutes)
   - Runs: `pnpm install`
   - Downloads all dependencies
   - **Error Point**: Lockfile mismatches, network timeouts

3. **Build Phase** (1-2 minutes)
   - Runs: `pnpm run build` (auto-detected from root package.json)
   - Builds all packages in workspace
   - **Error Point**: TypeScript errors, missing environment variables

4. **Prisma Generation** (30 seconds)
   - Auto-detects Prisma schema
   - Runs: `prisma generate`
   - **Error Point**: Missing DATABASE_URL

5. **Start Command** (immediate)
   - Runs: `pnpm start` (starts backend on detected port)
   - **Error Point**: Port binding, database connection

**🚨 Common Error Points & Solutions:**

| Stage | Error | Simple Fix |
|-------|--------|------------|
| Detection | "No build script found" | Use exact scripts from SIMPLE.md |
| Install | "Lockfile mismatch" | Delete `pnpm-lock.yaml`, run `pnpm install` |
| Build | "TypeScript errors" | Fix with `.js` extensions in imports |
| Prisma | "DATABASE_URL missing" | Set Railway environment variables |
| Start | "Port binding error" | Railway auto-assigns PORT, use `process.env.PORT` |

---

### **3. Alchemy Webhook Setup - From Ngrok to Production**

**🔍 Current Setup Analysis:**

Your webhook endpoint is: `POST /webhooks/alchemy-activity`

**Current Local Setup (with ngrok):**
```bash
# What you probably used locally
ngrok http 3001
# Generated: https://abc123.ngrok.io

# Alchemy webhook URL was: https://abc123.ngrok.io/webhooks/alchemy-activity
```

**🚀 Production Setup (Railway):**

1. **Deploy to Railway first**
   ```bash
   # Railway will give you a URL like:
   # https://your-app-name.railway.app
   ```

2. **Update Alchemy Webhooks**
   - Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
   - Navigate to "Webhooks" section
   - Update each webhook URL:
     - **Old**: `https://abc123.ngrok.io/webhooks/alchemy-activity`
     - **New**: `https://your-app-name.railway.app/webhooks/alchemy-activity`

3. **Environment Variables to Set on Railway:**
   ```bash
   DATABASE_URL=<railway-postgres-url>
   ALCHEMY_API_KEY=-htpBXri77IPTSz43Fsdy
   ALCHEMY_WEBHOOK_ID_AVALANCHE=wh_y0yvxx495ctl4k03
   ALCHEMY_WEBHOOK_ID_ETHEREUM=wh_p66vgwa1i62azn7v
   ALCHEMY_WEBHOOK_ID_BASE=wh_your_base_webhook_id
   ALCHEMY_WEBHOOK_ID_ARBITRUM=wh_vhxo5qwvciw3b1jb
   JWT_SECRET=ow9HbID3W.....fyCWf3vAYMPuk
   IEXEC_BACKEND_PRIVATE_KEY=8626b37b678e236966a406dc3fe4ca908954c5dc6f69038df216fccf29dfd88d
   IEXEC_APP_ADDRESS=0x192C....AA98F
   ```

**⚠️ Security Note:** Change `JWT_SECRET` and `IEXEC_BACKEND_PRIVATE_KEY` for production!

---

### **4. Beginner Deployment Guide - Step by Step**

**🎯 Step 1: Prepare for Deployment**
```bash
cd /home/utkdwd/Code/TempwalletB

# Ensure everything builds
pnpm run build

# Add the new SIMPLE.md file
git add SIMPLE.md
git commit -m "Add comprehensive deployment guide"
```

**🎯 Step 2: Deploy Backend to Railway**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `TempwalletB` repository
   - Select `iEXEC` branch

3. **Add Database**
   - In Railway dashboard, click "New Service"
   - Select "PostgreSQL"
   - Copy the connection string

4. **Set Environment Variables**
   - Click on your backend service
   - Go to "Variables" tab
   - Add all variables from the list above
   - Set `DATABASE_URL` to your PostgreSQL connection string

5. **Deploy**
   - Railway will auto-deploy
   - Copy your deployment URL (like `https://tempwallet-backend.railway.app`)

**🎯 Step 3: Deploy Frontend to Vercel**

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub account

2. **Import Project**
   - Click "New Project"
   - Import `TempwalletB` repository
   - Set root directory to `apps/frontend`
   - Framework preset: "Vite"

3. **Set Environment Variables**
   ```bash
   VITE_API_URL=https://your-railway-app.railway.app
   VITE_AVALANCHE_RPC=https://avax-mainnet.g.alchemy.com/v2/quPU3ryAXcLpXf5oXVK4O
   VITE_ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/H9E74Og5JWTvBvTDKAWTX
   # ... (copy other VITE_ variables from your .env)
   ```

4. **Deploy**
   - Vercel will auto-deploy
   - Copy your frontend URL

**🎯 Step 4: Update Alchemy Webhooks**
- Update webhook URLs to point to your Railway backend
- Test by making a small transaction

**📈 What to Expect:**
- **First deploy**: 5-10 minutes
- **Subsequent deploys**: 2-3 minutes
- **Database migrations**: Automatic with Prisma
- **Zero-downtime**: Both platforms support this

**🚫 What NOT to Do:**
- Don't add custom build configurations
- Don't create multiple deployment environments initially
- Don't optimize for scale before testing basic functionality
- Don't add complex CI/CD pipelines yet

---

### **5. Git Branch Management - Pushing to GitHub**

**✅ Current Status:**
- You're on `iEXEC` branch (confirmed)
- `SIMPLE.md` is untracked
- Previous changes are committed

**🚀 To Push to GitHub:**

```bash
# Add the new guide file
git add SIMPLE.md
git commit -m "Add comprehensive FAQ and deployment guide"

# Push to GitHub (first time push to new branch)
git push -u origin iEXEC
```

**What This Does:**
- Creates `iEXEC` branch on GitHub
- Pushes all commits to that branch
- Sets upstream tracking (`-u` flag)
- Your `main` branch remains unchanged

**🔄 Future Pushes:**
```bash
# After making changes
git add .
git commit -m "Your commit message"
git push  # No need for -u origin iEXEC anymore
```

**🌿 Branch Strategy:**
- `main` branch: Production-ready code
- `iEXEC` branch: Development with ESM + iExec integration
- Deploy from `iEXEC` branch initially
- Merge to `main` when everything works

---

## 🚨 **Common Deployment Errors & Quick Fixes**

### **Railway Errors**

| Error | Cause | Quick Fix |
|-------|--------|-----------|
| "Build failed: Cannot find module" | Missing `.js` extensions | Add `.js` to local imports |
| "Prisma client not generated" | Missing DATABASE_URL | Set environment variable |
| "Port already in use" | Hard-coded port | Use `process.env.PORT \|\| 3000` |
| "Module not found: @tempwallet/shared" | Workspace dependency | Use relative imports |

### **Vercel Errors**

| Error | Cause | Quick Fix |
|-------|--------|-----------|
| "Build failed: Vite build error" | Wrong build directory | Set root to `apps/frontend` |
| "API routes not working" | Backend URL missing | Set `VITE_API_URL` |
| "Environment variables undefined" | Missing VITE_ prefix | Prefix with `VITE_` |

### **Alchemy Webhook Errors**

| Error | Cause | Quick Fix |
|-------|--------|-----------|
| "Webhook not receiving data" | Wrong URL | Update to Railway URL |
| "Database connection error" | Wrong DATABASE_URL | Check Railway variables |
| "Transaction not processed" | Missing webhook IDs | Set all `ALCHEMY_WEBHOOK_ID_*` |

---

## 🎯 **Success Checklist**

**✅ Before Deployment:**
- [ ] `pnpm run build` works locally
- [ ] All environment variables documented
- [ ] Database schema is ready
- [ ] iEXEC branch has all changes

**✅ After Railway Deployment:**
- [ ] App starts without errors
- [ ] Database connection works
- [ ] Alchemy webhooks receive data
- [ ] Telegram notifications send

**✅ After Vercel Deployment:**
- [ ] Frontend loads without errors
- [ ] API calls to Railway backend work
- [ ] User authentication works
- [ ] Wallet creation works

**✅ After Alchemy Update:**
- [ ] Webhook endpoints receive POST requests
- [ ] Balance updates trigger correctly
- [ ] iExec notifications send to Telegram

---

## 🚀 **Next Steps After Successful Deployment**

1. **Monitor & Debug**
   - Check Railway logs for errors
   - Test all user flows
   - Verify Telegram notifications

2. **Performance**
   - Monitor response times
   - Check database query performance
   - Optimize if needed (but keep it simple!)

3. **Security**
   - Change default JWT secrets
   - Rotate iExec private keys
   - Set up proper CORS policies

4. **Features**
   - Add new blockchain networks
   - Improve notification formatting
   - Add more wallet types

**Remember: Ship first, optimize later!** 🚢

---

## 🆘 **Emergency Troubleshooting**

**If everything breaks:**

1. **Check SIMPLE.md first** - Follow the debugging guide
2. **Use simple fixes** - No complex solutions
3. **Roll back if needed** - `git checkout main`
4. **Ask for help** - Use the LLM context template

**Golden Rule: When in doubt, simplify!** ✨
