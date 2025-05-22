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

    // Handle services compilation
    console.log('Processing services...');
    const servicesSrc = path.join(process.cwd(), 'services');
    const apiDest = path.join(process.cwd(), '.vercel', 'output', 'functions', 'api');
    
    if (await exists(servicesSrc)) {
      const servicesDest = path.join(apiDest, 'services');
      await mkdir(servicesDest, { recursive: true });
      
      // Create a temporary tsconfig for services
      const tempTsConfig = {
        extends: '../tsconfig.json',
        compilerOptions: {
          outDir: path.relative(servicesSrc, servicesDest),
          rootDir: '.',
          noEmit: false,
          noEmitOnError: false
        },
        include: ['**/*.ts'],
        exclude: ['node_modules']
      };
      
      await fs.writeFile(
        path.join(servicesSrc, 'tsconfig.temp.json'),
        JSON.stringify(tempTsConfig, null, 2)
      );
      
      try {
        // First, copy all non-TypeScript files
        const files = await readdir(servicesSrc);
        for (const file of files) {
          if (file === 'tsconfig.temp.json') continue;
          
          const srcPath = path.join(servicesSrc, file);
          const destPath = path.join(servicesDest, file);
          
          if ((await stat(srcPath)).isDirectory()) {
            await copyDir(srcPath, destPath);
          } else if (!file.endsWith('.ts') && !file.endsWith('.json')) {
            await fs.copyFile(srcPath, destPath);
          }
        }
        
        // Compile TypeScript files
        console.log('Compiling TypeScript services...');
        const tscCmd = `cd ${servicesSrc} && npx tsc -p tsconfig.temp.json --skipLibCheck`;
        execSync(tscCmd, { stdio: 'inherit' });
        
        // Clean up temporary config
        await fs.unlink(path.join(servicesSrc, 'tsconfig.temp.json'));
        
      } catch (error) {
        console.error('Error processing services:', error);
        // Clean up temporary config even if there's an error
        if (await exists(path.join(servicesSrc, 'tsconfig.temp.json'))) {
          await fs.unlink(path.join(servicesSrc, 'tsconfig.temp.json'));
        }
        throw error;
      }
    }

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
