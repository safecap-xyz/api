import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, cpSync, readdirSync } from 'fs';

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

// Ensure output directories exist
const outputDir = join(__dirname, '.vercel', 'output', 'functions', 'api');
const apiOutputDir = join(outputDir, 'api');

// Create necessary directories
[outputDir, apiOutputDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Copy all .js files from src to output directory
const copyFiles = (src, dest) => {
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true, force: true });
  }
};

// Run TypeScript compilation
try {
  console.log('Running TypeScript compilation...');
  
  // First, compile all TypeScript files
  execSync('pnpm tsc --outDir .vercel/output/functions/api', { stdio: 'inherit' });
  
  // Then copy the compiled services files
  const servicesSrc = join(__dirname, 'services');
  const servicesDest = join(apiOutputDir, 'services');
  if (existsSync(servicesSrc)) {
    if (!existsSync(servicesDest)) {
      mkdirSync(servicesDest, { recursive: true });
    }
    console.log(`Copying compiled services from ${servicesSrc} to ${servicesDest}`);
    
    // Copy only .js files from the output directory
    const compiledServicesDir = join(__dirname, '.vercel', 'output', 'functions', 'api', 'services');
    if (existsSync(compiledServicesDir)) {
      const files = readdirSync(compiledServicesDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const srcPath = join(compiledServicesDir, file);
          const destPath = join(servicesDest, file);
          console.log(`  Copying compiled ${file}...`);
          cpSync(srcPath, destPath);
        }
      }
    } else {
      console.error(`Error: Compiled services directory not found at ${compiledServicesDir}`);
    }
  }

  // Copy other necessary directories (e.g., types, utils, etc.)
  const dirsToCopy = ['types', 'utils', 'config'];
  dirsToCopy.forEach(dir => {
    const src = join(__dirname, dir);
    const dest = join(apiOutputDir, dir);
    if (existsSync(src)) {
      if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true });
      }
      console.log(`Copying ${dir} from ${src} to ${dest}`);
      cpSync(src, dest, { recursive: true });
    }
  });
  
  // Create a simple index.js in the root that imports from the api directory
  const rootIndexPath = join(outputDir, 'index.js');
  const rootIndexContent = `// Auto-generated entry point
import { handler } from './api/index.js';
export default handler;
`;
  writeFileSync(rootIndexPath, rootIndexContent);
  console.log(`Created root index.js at ${rootIndexPath}`);

  // Verify the output directory was created
  if (!existsSync(outputDir)) {
    throw new Error('Build output directory was not created. Check TypeScript compilation logs for errors.');
  }
  
  console.log('Build completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
