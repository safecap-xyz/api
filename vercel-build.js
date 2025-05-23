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
  
  // First, ensure the output directory structure exists
  const compiledOutputDir = join(__dirname, '.vercel', 'output', 'functions', 'api');
  
  // Compile TypeScript files
  execSync('pnpm tsc --outDir .vercel/output/functions/api', { stdio: 'inherit' });
  
  // Copy the services directory to the output
  const servicesSrc = join(__dirname, 'services');
  const servicesDest = join(compiledOutputDir, 'services');
  
  // Create the services directory in the output if it doesn't exist
  if (!existsSync(servicesDest)) {
    mkdirSync(servicesDest, { recursive: true });
  }
  
  if (existsSync(servicesSrc)) {
    console.log(`Copying services directory to ${servicesDest}...`);
    
    // Ensure the destination directory exists
    if (!existsSync(servicesDest)) {
      mkdirSync(servicesDest, { recursive: true });
    }
    
    // Copy all .js files from the source services directory
    const serviceFiles = readdirSync(servicesSrc).filter(file => file.endsWith('.js'));
    
    for (const file of serviceFiles) {
      const srcPath = join(servicesSrc, file);
      const destPath = join(servicesDest, file);
      
      if (existsSync(srcPath)) {
        console.log(`  Copying ${file}...`);
        cpSync(srcPath, destPath);
      }
    }
    
    // Also copy any .d.ts files for type definitions
    const typeFiles = readdirSync(servicesSrc).filter(file => file.endsWith('.d.ts'));
    for (const file of typeFiles) {
      const srcPath = join(servicesSrc, file);
      const destPath = join(servicesDest, file);
      
      if (existsSync(srcPath)) {
        console.log(`  Copying type definition ${file}...`);
        cpSync(srcPath, destPath);
      }
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
