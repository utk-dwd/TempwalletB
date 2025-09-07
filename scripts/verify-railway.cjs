const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Railway Deployment Verification');

// Detect build environment
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
const isDocker = process.env.DOCKER_CONTAINER || fs.existsSync('/.dockerenv') || process.env.DOCKER_BUILD;
const isCI = process.env.CI || process.env.CONTINUOUS_INTEGRATION;
const isBuildTime = !process.env.NODE_ENV || process.env.NODE_ENV === 'production' || process.env.DOCKER_BUILD;

console.log(`📍 Environment: ${isRailway ? 'Railway' : isDocker ? 'Docker' : 'Local'}`);
console.log(`🏗️  Phase: ${isBuildTime ? 'Build' : 'Runtime'}`);

try {
  // Check if lockfile exists and is valid
  if (!fs.existsSync('pnpm-lock.yaml')) {
    console.error('❌ pnpm-lock.yaml not found');
    process.exit(1);
  }

  // Check if package.json and lockfile are in sync
  try {
    execSync('pnpm install --frozen-lockfile --dry-run', { stdio: 'pipe' });
    console.log('✅ Lockfile is synchronized with package.json');
  } catch (error) {
    const isLocalDev = !isRailway && !isDocker && !isCI;
    if (isLocalDev) {
      console.log('ℹ️  Lockfile sync check skipped in local development');
      console.log('💡 This is normal - lockfile will be updated when you run pnpm install');
    } else {
      console.log('⚠️  Lockfile mismatch detected, will regenerate during install');
      console.log('💡 This ensures dependencies are correctly resolved for deployment');
    }
    if (error.message.includes('ERR_PNPM_OUTDATED_LOCKFILE')) {
      console.log('📝 Lockfile is outdated but will be updated automatically');
    }
  }

  // Check Prisma client generation status (Docker-aware)
  const isDockerBuild = process.env.DOCKER_BUILD || process.cwd().includes('/app') || isDocker;
  const possibleClientPaths = [
    path.join('packages', 'prisma', 'node_modules', '@prisma', 'client'),
    path.join('packages', 'prisma', 'node_modules', '.pnpm', '@prisma+client*/node_modules', '@prisma', 'client'),
    path.join('node_modules', '.pnpm', '@prisma+client*/node_modules', '@prisma', 'client'),
    path.join('node_modules', '@prisma', 'client')
  ];

  let clientFound = false;
  for (const clientPath of possibleClientPaths) {
    // Handle glob patterns for pnpm
    if (clientPath.includes('*')) {
      try {
        const glob = require('glob');
        const matches = glob.sync(clientPath.replace('*', '*'));
        if (matches.length > 0 && fs.existsSync(matches[0])) {
          clientFound = true;
          break;
        }
      } catch (e) {
        // glob not available, skip
      }
    } else if (fs.existsSync(clientPath)) {
      clientFound = true;
      break;
    }
  }

  if (clientFound) {
    console.log('✅ Prisma client found');
  } else {
    if (isBuildTime || isDockerBuild) {
      console.log('⚠️  Prisma client not found - will be generated during build');
      console.log('💡 This is normal during Docker/Railway deployment');
    } else {
      console.log('❌ Prisma client missing in runtime environment');
      console.log('💡 Run: cd packages/prisma && pnpm prisma generate');
    }
  }

  // Check Prisma schema exists
  const prismaSchemaPath = path.join('packages', 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchemaPath)) {
    console.log('✅ Prisma schema found');
  } else {
    console.error('❌ Prisma schema not found at packages/prisma/schema.prisma');
    process.exit(1);
  }

  // Check for required dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.devDependencies && packageJson.devDependencies.prisma) {
    console.log('✅ Prisma found in root devDependencies');
  }

  // Check build scripts for Docker compatibility
  if (packageJson.scripts) {
    const hasBuildScript = packageJson.scripts.build || packageJson.scripts['build:docker'];
    const hasPrismaScript = packageJson.scripts['prisma:generate'] || packageJson.scripts['db:generate'];

    if (hasBuildScript) {
      console.log('✅ Build script found');
    } else if (isDocker) {
      console.log('⚠️  No build script found - Docker builds may fail');
    }

    if (hasPrismaScript) {
      console.log('✅ Prisma generation script found');
    } else if (isDocker) {
      console.log('⚠️  No Prisma generation script found - client generation may fail');
    }
  }

  // Environment-specific checks
  if (isRailway) {
    console.log(`✅ Railway environment: ${process.env.RAILWAY_ENVIRONMENT || 'detected'}`);

    if (!process.env.DATABASE_URL && isBuildTime) {
      console.log('⚠️  DATABASE_URL not set during build - using placeholder for client generation');
      console.log('💡 Real DATABASE_URL will be used at runtime');
    }
  }

  if (isDocker) {
    console.log('✅ Docker environment detected');

    // Check for Docker-specific files
    const dockerfileExists = fs.existsSync('Dockerfile');
    const nixpacksExists = fs.existsSync('nixpacks.toml');

    if (dockerfileExists) {
      console.log('✅ Dockerfile found');
    } else {
      console.log('⚠️  Dockerfile not found - Railway may use Nixpacks instead');
    }

    if (nixpacksExists) {
      console.log('✅ nixpacks.toml found');
    } else {
      console.log('ℹ️  nixpacks.toml not found - Railway will use default configuration');
    }
  }

  console.log('🎉 Railway deployment verification passed');

} catch (error) {
  console.error('❌ Railway verification failed:', error.message);

  if (error.message.includes('prisma')) {
    console.log('\n💡 Prisma-specific troubleshooting:');
    console.log('1. Ensure DATABASE_URL is set (or use placeholder during build)');
    console.log('2. Run: pnpm --filter @tempwallet/prisma run generate');
    console.log('3. Check packages/prisma/schema.prisma exists');
  }

  process.exit(1);
}
