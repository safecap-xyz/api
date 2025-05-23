import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const writeFile = promisify(fs.writeFile);

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyFilesWithExtensions(src, dest, extensions) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyFilesWithExtensions(srcPath, destPath, extensions);
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      await copyFile(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

async function copyPackageFiles() {
  const outputDir = path.join(__dirname, '.vercel', 'output', 'functions', 'api');
  
  // Copy package.json with updated type
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.type = 'module'; // Ensure we're using ESM
  await writeFile(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Copy tsconfig.json
  await copyFile('tsconfig.json', path.join(outputDir, 'tsconfig.json'));
  
  console.log('Copied configuration files');
}

async function build() {
  try {
    // Create public directory with a basic index.html
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }
    
    await writeFile(
      path.join(publicDir, 'index.html'),
      '<!DOCTYPE html><html><head><title>API Server</title></head><body><h1>API Server</h1><p>This is an API server.</p></body></html>'
    );

    // Ensure output directory exists
    const outputDir = path.join(__dirname, '.vercel', 'output', 'functions', 'api');
    await mkdir(outputDir, { recursive: true });

    console.log('Compiling TypeScript...');
    execSync('pnpm tsc', { stdio: 'inherit' });

    // Copy the compiled JavaScript files and type definitions
    console.log('Copying compiled files...');
    
    // Copy API directory with .js and .d.ts files
    const apiSrc = path.join(__dirname, 'api');
    const apiDest = path.join(outputDir, 'api');
    await copyFilesWithExtensions(apiSrc, apiDest, ['.js', '.d.ts']);
    
    // Copy services directory with .js and .d.ts files
    console.log('Copying services...');
    const servicesSrc = path.join(__dirname, 'services');
    const servicesDest = path.join(outputDir, 'services');
    
    if (fs.existsSync(servicesSrc)) {
      await copyFilesWithExtensions(servicesSrc, servicesDest, ['.js', '.d.ts']);
    }
    
    // Copy package files with proper configuration
    await copyPackageFiles();
    
    // Copy any other necessary files (like .env, etc.)
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      await copyFile(envPath, path.join(outputDir, '.env'));
      console.log('Copied .env file');
    }

    // Copy artifacts if they exist
    const artifactsSrc = path.join(__dirname, 'api', 'artifacts');
    if (fs.existsSync(artifactsSrc)) {
      const artifactsDest = path.join(outputDir, 'api', 'artifacts');
      await copyFilesWithExtensions(artifactsSrc, artifactsDest, ['.json']);
      console.log('Copied artifacts directory');
    }

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
