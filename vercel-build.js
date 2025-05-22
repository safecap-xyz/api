import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { copyFile, mkdir, readdir, stat, readFile, writeFile } = fs;

async function copyDir(src, dest, { filter = () => true } = {}) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, { filter });
    } else if (filter(entry.name)) {
      await mkdir(path.dirname(destPath), { recursive: true });
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
    console.log('Starting build process...');
    
    // Ensure .vercel/output directory exists
    const vercelOutputDir = path.join(process.cwd(), '.vercel', 'output', 'functions');
    const apiOutputDir = path.join(vercelOutputDir, 'api');
    
    // Create necessary directories
    await mkdir(apiOutputDir, { recursive: true });
    
    // First, compile TypeScript files
    console.log('Compiling TypeScript...');
    execSync('pnpm tsc', { stdio: 'inherit' });
    
    // Copy compiled JavaScript files from the output directory
    const compiledDir = path.join(process.cwd(), '.vercel', 'output', 'functions');
    
    // Copy api directory
    const apiSrc = path.join(process.cwd(), '.vercel', 'output', 'functions', 'api');
    if (await exists(apiSrc)) {
      console.log(`Copying compiled API files from ${apiSrc} to ${apiOutputDir}`);
      await copyDir(apiSrc, apiOutputDir, {
        filter: (filename) => {
          return filename.endsWith('.js') || 
                 filename.endsWith('.d.ts') ||
                 filename.endsWith('.json');
        }
      });
    }
    
    // Copy original TS services directory to ensure .js extensions work
    const servicesSrc = path.join(process.cwd(), 'services');
    const servicesDest = path.join(apiOutputDir, '..', 'services');
    
    if (await exists(servicesSrc)) {
      console.log(`Copying services from ${servicesSrc} to ${servicesDest}`);
      await copyDir(servicesSrc, servicesDest, {
        filter: (filename) => {
          // Include all service files
          return true;
        }
      });
    }

    // Copy the compiled service files too
    const compiledServicesSrc = path.join(process.cwd(), '.vercel', 'output', 'functions', 'services');
    if (await exists(compiledServicesSrc)) {
      console.log(`Copying compiled services from ${compiledServicesSrc} to ${servicesDest}`);
      await copyDir(compiledServicesSrc, servicesDest, {
        filter: (filename) => {
          return filename.endsWith('.js') || filename.endsWith('.d.ts') || filename.endsWith('.json');
        }
      });
    }
    
    // Copy package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    
    // Update the package.json to use the correct main file
    packageJson.main = 'api/index.js';
    
    // Write the updated package.json to the functions directory
    await writeFile(
      path.join(vercelOutputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    
    // Create a basic config.json for Vercel
    const vercelConfig = {
      version: 3,
      builds: [
        {
          src: 'api/index.js',
          use: '@vercel/node'
        }
      ],
      routes: [
        { src: '/api/(.*)', dest: '/api' },
        { src: '/(.*)', dest: '/api' }
      ]
    };
    
    await writeFile(
      path.join(vercelOutputDir, 'config.json'),
      JSON.stringify(vercelConfig, null, 2),
      'utf8'
    );
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
