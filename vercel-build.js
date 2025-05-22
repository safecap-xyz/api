const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

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

    // Copy services directory
    console.log('Copying services...');
    const servicesSrc = path.join(__dirname, 'services');
    const servicesDest = path.join(outputDir, 'services');
    
    if (fs.existsSync(servicesSrc)) {
      await copyDir(servicesSrc, servicesDest);
    }

    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
