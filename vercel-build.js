const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create public directory with a basic index.html
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}
fs.writeFileSync(
  path.join(publicDir, 'index.html'),
  '<!DOCTYPE html><html><head><title>API Server</title></head><body><h1>API Server</h1><p>This is an API server.</p></body></html>'
);

// Run TypeScript compilation
try {
  execSync('pnpm tsc --outDir .vercel/output/functions/api', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
