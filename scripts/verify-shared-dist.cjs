const fs = require('fs');
const path = require('path');

const sharedDistPath = path.join(__dirname, '..', 'packages', 'shared', 'dist', 'index.d.ts');

if (!fs.existsSync(sharedDistPath)) {
  console.error('Shared package dist not found. Building...');
  process.exit(1);
}

console.log('Shared dist verified.');
