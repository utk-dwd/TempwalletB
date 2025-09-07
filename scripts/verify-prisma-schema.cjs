const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'packages', 'prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error('Prisma schema not found.');
  process.exit(1);
}

console.log('Prisma schema verified.');
