import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requiredVars } from '../config/index.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadEnvironment() {
  // Try multiple possible .env file locations
  const possibleEnvPaths = [
    resolve(process.cwd(), '.env'),                // Project root
    resolve(__dirname, '../../../.env'),          // Three levels up from api/utils/
    resolve(process.cwd(), '..', '.env'),         // One level up
    resolve(process.cwd(), '../..', '.env'),      // Two levels up
  ];

  let envPath = '';
  for (const path of possibleEnvPaths) {
    try {
      const result = config({ path });
      if (!result.error) {
        envPath = path;
        break;
      } else if (result.error) {
        console.log(`Error loading .env from ${path}:`, result.error.message);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to load .env from ${path}:`, errorMessage);
    }
  }

  if (!envPath) {
    console.error('Failed to load .env file from any location');
  } else {
    console.log('Successfully loaded .env from:', envPath);
  }

  return envPath;
}

export function validateEnvironment() {
  // Debug log environment loading
  console.log('Environment variables loaded:', Object.keys(process.env).filter(key =>
    key.startsWith('CDP_') ||
    key.startsWith('ALCHEMY_') ||
    key === 'NODE_ENV'
  ));

  // Verify CDP environment variables are set
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.log('Current CDP_API_KEY_ID exists:', 'CDP_API_KEY_ID' in process.env);
    console.log('Current CDP_API_KEY_SECRET exists:', 'CDP_API_KEY_SECRET' in process.env);
    console.log('Current CDP_WALLET_SECRET exists:', 'CDP_WALLET_SECRET' in process.env);
  }

  return missingVars.length === 0;
}

export function setupUnhandledRejection() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
    // Optionally exit with a non-zero code
    // process.exit(1);
  });
}
