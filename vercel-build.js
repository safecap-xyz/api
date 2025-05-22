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
    
    // Create the base output directory for Vercel
    const vercelBaseDir = path.join(process.cwd(), '.vercel');
    const vercelOutputDir = path.join(vercelBaseDir, 'output');
    const vercelFunctionsDir = path.join(vercelOutputDir, 'functions');
    const apiOutputDir = path.join(vercelFunctionsDir, 'api');
    
    // Create all necessary directories
    await mkdir(vercelBaseDir, { recursive: true });
    await mkdir(vercelOutputDir, { recursive: true });
    await mkdir(vercelFunctionsDir, { recursive: true });
    await mkdir(apiOutputDir, { recursive: true });
    
    // Create services directory in the output
    const servicesOutputDir = path.join(vercelFunctionsDir, 'services');
    await mkdir(servicesOutputDir, { recursive: true });
    
    // First copy the source TypeScript files to the output directory
    // This ensures that the imports with .js extensions will work correctly
    const apiSrcDir = path.join(process.cwd(), 'api');
    const servicesSrcDir = path.join(process.cwd(), 'services');
    const typesSrcDir = path.join(process.cwd(), 'types');
    
    console.log(`Copying API source files from ${apiSrcDir} to ${apiOutputDir}`);
    await copyDir(apiSrcDir, apiOutputDir);
    
    console.log(`Copying services source files from ${servicesSrcDir} to ${servicesOutputDir}`);
    await copyDir(servicesSrcDir, servicesOutputDir);
    
    // Copy the types directory with declaration files
    const typesOutputDir = path.join(vercelFunctionsDir, 'types');
    await mkdir(typesOutputDir, { recursive: true });
    
    if (await exists(typesSrcDir)) {
      console.log(`Copying type declarations from ${typesSrcDir} to ${typesOutputDir}`);
      await copyDir(typesSrcDir, typesOutputDir);
    }
    
    // Now compile TypeScript files in place
    console.log('Compiling TypeScript...');
    execSync('pnpm tsc', { stdio: 'inherit' });
    
    // Handle any files that need to be manually copied to the output directory
    console.log('Copying additional files...');
    
    // Copy package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    
    // Update the package.json to use the correct main file
    packageJson.main = 'api/index.js';
    
    // Write the updated package.json to the functions directory
    await writeFile(
      path.join(vercelFunctionsDir, 'package.json'),
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
    
    // Generate standard Vercel output configuration
    await writeFile(
      path.join(vercelOutputDir, 'config.json'),
      JSON.stringify(vercelConfig, null, 2),
      'utf8'
    );
    
    // Copy node_modules if necessary
    const nodeModulesSrc = path.join(process.cwd(), 'node_modules');
    const nodeModulesDest = path.join(vercelFunctionsDir, 'node_modules');
    
    if (await exists(nodeModulesSrc)) {
      console.log('Creating node_modules symlink...');
      try {
        // Instead of copying, create a symlink to save space and time
        await fs.symlink(nodeModulesSrc, nodeModulesDest, 'junction');
      } catch (err) {
        console.log('Symlink failed, continuing without node_modules copy');
      }
    }
    
    // Create a static output directory with a success page
    const staticDir = path.join(vercelOutputDir, 'static');
    await mkdir(staticDir, { recursive: true });
    
    // Create a basic success page
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SafeCap API</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; }
            h1 { color: #0070f3; }
            p { color: #333; }
          </style>
        </head>
        <body>
          <h1>SafeCap API</h1>
          <p>API server is running. Access the API at /api</p>
        </body>
      </html>
    `;
    
    await writeFile(path.join(staticDir, 'index.html'), successHtml, 'utf8');
    
    console.log('=====================================================');
    console.log('🚀 Build completed successfully!');
    console.log('📁 Output directory: ' + vercelOutputDir);
    console.log('📋 API files: ' + apiOutputDir);
    console.log('=====================================================');
  } catch (error) {
    console.error('❌ Build failed:');
    console.error(error);
    process.exit(1);
  }
}

build();
