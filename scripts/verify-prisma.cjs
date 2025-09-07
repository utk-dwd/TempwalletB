const { execSync } = require('child_process');
const path = require('path');

const fs = require('fs');

try {
  const isDocker = process.env.DOCKER_BUILD || fs.existsSync('/.dockerenv');
  const phase = process.env.BUILD_PHASE || 'unknown';

  // Check if Prisma CLI is accessible
  execSync('pnpm prisma --version', { stdio: 'pipe', cwd: path.join(__dirname, '../packages/prisma') });
  console.log('✅ Prisma CLI accessible via pnpm');

  // Check if @prisma/client exists
  const clientPath = path.join(__dirname, '../packages/prisma/node_modules/@prisma/client');
  if (fs.existsSync(clientPath)) {
    console.log('✅ @prisma/client installed');
  } else {
    if (isDocker) {
      console.log('⚠️  @prisma/client missing (Docker build) – will attempt generation later');
    } else {
      console.log('❌ @prisma/client missing');
      process.exit(1);
    }
  }

  // Check if schema.prisma exists
  const schemaPath = path.join(__dirname, '../packages/prisma/schema.prisma');
  if (fs.existsSync(schemaPath)) {
    console.log('✅ schema.prisma found');
  } else {
    console.log('❌ schema.prisma missing');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Prisma verification failed:', error.message);
  console.log('💡 Try: pnpm --filter @tempwallet/prisma install');
  process.exit(1);
}
