import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { copyFile, mkdir, readdir, stat } = fs;

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts') || entry.name.endsWith('.json')) {
      await copyFile(srcPath, destPath);
    }
  }
}

// Check if directory exists
async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function build() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const outputDir = path.join(process.cwd(), '.vercel', 'output', 'static');
    
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });
    
    // Create public directory if it doesn't exist
    if (!(await exists(publicDir))) {
      await mkdir(publicDir, { recursive: true });
    }
    
    // Create a basic index.html
    await fs.writeFile(
      path.join(publicDir, 'index.html'),
      '<!DOCTYPE html><html><head><title>API Server</title></head><body><h1>API Server</h1><p>This is an API server.</p></body></html>'
    );

    // Copy public files to output directory
    if (await exists(publicDir)) {
      await copyDir(publicDir, outputDir);
    }
    
    console.log('Compiling TypeScript...');
    execSync('pnpm tsc', { stdio: 'inherit' });

    // Copy services directory
    console.log('Copying services...');
    const servicesSrc = path.join(process.cwd(), 'services');
    const servicesDest = path.join(process.cwd(), '.vercel', 'output', 'functions', 'api', 'services');
    
    if (await exists(servicesSrc)) {
      await copyDir(servicesSrc, servicesDest);
    }

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
