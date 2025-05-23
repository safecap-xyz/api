import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputDir = join(__dirname, '..', '.vercel', 'output', 'functions', 'api');

console.log('Verifying build output...');
console.log(`Checking directory: ${outputDir}`);

// Check if output directory exists
if (!existsSync(outputDir)) {
  console.error('❌ Output directory does not exist');
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  'index.js',
  'api/index.js',
  'services/mastraService.js'  // Updated path to check in the root of the output
];

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = join(outputDir, file);
  const exists = existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  } else if (file.endsWith('.js')) {
    // Check if the file has content
    try {
      const content = readFileSync(filePath, 'utf-8');
      if (!content.trim()) {
        console.error(`❌ ${file} is empty`);
        allFilesExist = false;
      }
    } catch (err) {
      console.error(`❌ Error reading ${file}:`, err.message);
      allFilesExist = false;
    }
  }
}

if (allFilesExist) {
  console.log('\n✅ Build verification passed!');
} else {
  console.error('\n❌ Some required files are missing or empty');
  process.exit(1);
}
