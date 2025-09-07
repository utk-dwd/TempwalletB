const fs = require('fs');
const path = require('path');

// Check if shared package dist exists and has expected files
const sharedDistDir = path.join(__dirname, '..', 'packages', 'shared', 'dist');
const expectedFiles = ['index.js', 'index.d.ts'];

console.log('🔍 Checking shared package dist...');

if (!fs.existsSync(sharedDistDir)) {
  console.error('❌ Shared package dist directory not found');
  process.exit(1);
}

let allFilesExist = true;
expectedFiles.forEach(file => {
  const filePath = path.join(sharedDistDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('❌ Some shared package files are missing');
  process.exit(1);
}

// Check if the main index.d.ts has expected exports
try {
  const indexDtsContent = fs.readFileSync(path.join(sharedDistDir, 'index.d.ts'), 'utf8');
  const expectedExports = ['SupportedNetwork', 'EventName', 'NETWORKS', 'NetworkConfig', 'TokenDetails'];
  let allExportsFound = true;

  expectedExports.forEach(exportName => {
    if (indexDtsContent.includes(exportName)) {
      console.log(`✅ Export ${exportName} found in index.d.ts`);
    } else {
      console.log(`❌ Export ${exportName} missing from index.d.ts`);
      allExportsFound = false;
    }
  });

  if (!allExportsFound) {
    console.error('❌ Some expected exports are missing from index.d.ts');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to read index.d.ts:', error.message);
  process.exit(1);
}

console.log('🎉 Shared package smoke test passed!');
