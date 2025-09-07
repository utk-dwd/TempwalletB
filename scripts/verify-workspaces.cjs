const fs = require('fs');
const path = require('path');

function log(msg){ console.log(msg); }

try {
  const root = path.join(__dirname, '..');
  const wsFile = path.join(root, 'pnpm-workspace.yaml');
  if (!fs.existsSync(wsFile)) {
    console.error('❌ pnpm-workspace.yaml missing');
    process.exit(1);
  }
  // Minimal YAML parser for simple 'packages:' array structure to avoid external dependency
  const raw = fs.readFileSync(wsFile, 'utf8').split('\n');
  let inPackages = false; const patterns = [];
  for (const line of raw) {
    if (/^packages:/i.test(line.trim())) { inPackages = true; continue; }
    if (inPackages) {
      if (/^-\s+['"]?(.+?)['"]?\s*$/.test(line.trim())) {
        const m = line.trim().match(/^-\s+['"]?(.+?)['"]?\s*$/);
        if (m) patterns.push(m[1]);
      } else if (line.trim().length === 0) {
        continue;
      } else if (!line.startsWith(' ') && !line.startsWith('  -')) { // new top-level key
        break;
      }
    }
  }
  log(`📦 Workspace patterns: ${patterns.join(', ')}`);
  const missing = [];

  // naive glob-less expansion: walk directories under specified roots
  patterns.forEach(pat => {
    if (pat.endsWith('/*')) {
      const dir = pat.replace('/*','');
      const full = path.join(root, dir);
      if (fs.existsSync(full)) {
        const children = fs.readdirSync(full);
        children.forEach(ch => {
          const pkgJson = path.join(full, ch, 'package.json');
            if (fs.existsSync(pkgJson)) {
              log(`✅ Found package.json: ${dir}/${ch}`);
            } else {
              log(`ℹ️ Skipping non-package entry: ${dir}/${ch}`);
            }
        });
      }
    } else {
      const maybe = path.join(root, pat, 'package.json');
      if (fs.existsSync(maybe)) {
        log(`✅ Found package.json: ${pat}`);
      } else {
        missing.push(pat);
      }
    }
  });

  if (missing.length) {
    console.warn('⚠️ Missing package.json for patterns:', missing);
  }
  log('🧪 Workspace verification complete');
  process.exit(0);
} catch (e) {
  console.error('❌ Workspace verification failed:', e.message);
  process.exit(1);
}
