import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      // Copy all files - both source .ts and compiled .js files are important
      // for NodeNext module resolution to work properly
      await copyFile(srcPath, destPath);
    }
  }
}

async function copySourceWithExtension(src, dest) {
  // This ensures we copy both the TypeScript source files (for proper imports) 
  // and the compiled JavaScript files
  await mkdir(dest, { recursive: true });
  
  try {
    const entries = await readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copySourceWithExtension(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
        console.log(`Copied: ${srcPath} -> ${destPath}`);
      }
    }
  } catch (error) {
    console.error(`Error copying directory ${src}:`, error);
  }
}

async function build() {
  try {
    // Create public directory with a basic index.html
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(publicDir, 'index.html'),
      '<!DOCTYPE html><html><head><title>API Server</title></head><body><h1>API Server</h1><p>This is an API server.</p></body></html>'
    );

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '.vercel', 'output', 'functions', 'api');
    await mkdir(outputDir, { recursive: true });

    console.log('Compiling TypeScript...');
    execSync('pnpm tsc', { stdio: 'inherit' });

    // Copy the original TypeScript files alongside compiled JavaScript files
    // This is important for the NodeNext module resolution strategy
    console.log('Copying source files...');
    
    // Copy API directory with all subdirectories
    const apiSrc = path.join(__dirname, 'api');
    const apiDest = path.join(outputDir, 'api');
    await copySourceWithExtension(apiSrc, apiDest);
    
    // Copy services directory
    console.log('Copying services...');
    const servicesSrc = path.join(__dirname, 'services');
    const servicesDest = path.join(outputDir, 'services');
    
    if (fs.existsSync(servicesSrc)) {
      await copySourceWithExtension(servicesSrc, servicesDest);
    }
    
    // Copy artifacts if they exist
    const artifactsSrc = path.join(__dirname, 'api', 'artifacts');
    const artifactsDest = path.join(outputDir, 'api', 'artifacts');
    if (fs.existsSync(artifactsSrc)) {
      await copySourceWithExtension(artifactsSrc, artifactsDest);
    }

    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
