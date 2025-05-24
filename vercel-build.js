import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create public directory with a basic index.html
const publicDir = join(__dirname, 'public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

writeFileSync(
  join(publicDir, 'index.html'),
  '<!DOCTYPE html><html><head><title>API Server</title></head><body><h1>API Server</h1><p>This is an API server.</p></body></html>'
);

// Run TypeScript compilation
try {
  execSync('pnpm tsc --outDir .vercel/output/functions/api', { stdio: 'inherit' });
  console.log('TypeScript compilation completed successfully');
  
  // Verify the output directory was created
  const outputDir = join(__dirname, '.vercel', 'output', 'functions', 'api');
  if (!existsSync(outputDir)) {
    throw new Error('Build output directory was not created. Check TypeScript compilation logs for errors.');
  }
  
  console.log('Build completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
