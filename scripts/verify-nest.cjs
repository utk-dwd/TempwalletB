const fs = require('fs');
const path = require('path');

// Try root then backend local node_modules
const rootNest = path.join(__dirname, '..', 'node_modules', '.bin', 'nest');
const backendNest = path.join(__dirname, '..', 'apps', 'backend', 'node_modules', '.bin', 'nest');
const nestBin = [rootNest, backendNest].find(p => fs.existsSync(p)) || rootNest;

try {
  if (fs.existsSync(nestBin)) {
    const stat = fs.statSync(nestBin);
    if (stat.size < 10) {
      console.warn('⚠️  nest binary file suspiciously small, may be a broken symlink');
    }
    console.log('✅ Nest CLI present');
    process.exit(0);
  } else {
    console.error('❌ Nest CLI missing at node_modules/.bin/nest');
    console.log('💡 It should be installed as a devDependency of @tempwallet/backend or root.');
    console.log('💡 Will attempt automatic remediation if run inside build pipeline.');
    process.exit(1);
  }
} catch (e) {
  console.error('❌ verify-nest failed:', e.message);
  process.exit(1);
}
