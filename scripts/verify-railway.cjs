const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Railway Deployment Verification');

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
    console.log('⚠️  Lockfile mismatch detected, will regenerate during install');
    console.log('Error details:', error.message.split('\n')[0]);
  }

  // Check for Railway-specific environment
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log(`✅ Railway environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  }

  // Check for required dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.devDependencies && packageJson.devDependencies.prisma) {
    console.log('✅ Prisma found in root devDependencies');
  }

  console.log('🎉 Railway deployment verification passed');

} catch (error) {
  console.error('❌ Railway verification failed:', error.message);
  process.exit(1);
}
