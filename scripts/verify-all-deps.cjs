const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying all dependencies...');

// Check shared package
const sharedDistPath = path.join(__dirname, '..', 'packages', 'shared', 'dist', 'index.d.ts');
if (!fs.existsSync(sharedDistPath)) {
  console.error('❌ Shared package dist not found');
  process.exit(1);
}
console.log('✅ Shared package dist found');

// Check prisma package
const prismaDistPath = path.join(__dirname, '..', 'packages', 'prisma', 'dist', 'index.d.ts');
if (!fs.existsSync(prismaDistPath)) {
  console.error('❌ Prisma package dist not found');
  process.exit(1);
}
console.log('✅ Prisma package dist found');

// Check backend dist
const backendDistPath = path.join(__dirname, '..', 'apps', 'backend', 'dist', 'main.js');
if (!fs.existsSync(backendDistPath)) {
  console.error('❌ Backend dist not found');
  process.exit(1);
}
console.log('✅ Backend dist found');

// Check frontend dist
const frontendDistPath = path.join(__dirname, '..', 'apps', 'frontend', 'dist', 'index.html');
if (!fs.existsSync(frontendDistPath)) {
  console.error('❌ Frontend dist not found');
  process.exit(1);
}
console.log('✅ Frontend dist found');

console.log('🎉 All dependencies verified successfully!');
