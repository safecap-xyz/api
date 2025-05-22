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
    const vercelOutputDir = path.join(process.cwd(), '.vercel', 'output');
    await mkdir(vercelOutputDir, { recursive: true });
    
    // Copy services directory to output
    const servicesSrc = path.join(process.cwd(), 'services');
    const servicesDest = path.join(vercelOutputDir, 'functions/api/services');
    
    if (await exists(servicesSrc)) {
      console.log(`Copying services from ${servicesSrc} to ${servicesDest}`);
      await copyDir(servicesSrc, servicesDest, {
        filter: (filename) => {
          // Only copy JavaScript, TypeScript, and JSON files
          return filename.endsWith('.js') || 
                 filename.endsWith('.ts') || 
                 filename.endsWith('.json') ||
                 filename.endsWith('.d.ts');
        }
      });
    } else {
      console.warn(`Services directory not found at ${servicesSrc}`);
    }
    
    // Copy package.json to the functions directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    
    // Update the package.json to use the correct main file
    packageJson.main = 'api/index.js';
    
    // Write the updated package.json to the functions directory
    const outputPackageJsonPath = path.join(vercelOutputDir, 'functions/package.json');
    await mkdir(path.dirname(outputPackageJsonPath), { recursive: true });
    await writeFile(outputPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    
    // Create a basic vercel.json configuration
    const vercelConfig = {
      version: 2,
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
    
    // Compile TypeScript files
    console.log('Compiling TypeScript...');
    execSync('pnpm tsc', { stdio: 'inherit' });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
