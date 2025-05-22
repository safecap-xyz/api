// Load environment variables
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the project root directory (two levels up from config directory)
const projectRoot = resolve(__dirname, '../..');

// Explicitly load .env file from the project root
const envPath = resolve(projectRoot, '.env');
console.log('Attempting to load .env from:', envPath);

// Load the environment variables
const result = config({ path: envPath });

if (result.error) {
  console.error('Failed to load .env file:', result.error);
} else {
  console.log('Successfully loaded .env file');
}

// Debug log environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' + process.env.OPENAI_API_KEY.slice(-4) : 'undefined',
  CDP_API_KEY_ID: process.env.CDP_API_KEY_ID ? '***' + process.env.CDP_API_KEY_ID.slice(-4) : 'undefined',
  CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET ? '***' + process.env.CDP_API_KEY_SECRET.slice(-4) : 'undefined',
  CDP_WALLET_SECRET: process.env.CDP_WALLET_SECRET ? '***' + process.env.CDP_WALLET_SECRET.slice(-4) : 'undefined'
});

// Verify CDP environment variables are set
export const verifyEnvVariables = (): string[] => {
  const requiredVars = ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'CDP_WALLET_SECRET'];
  return requiredVars.filter(varName => !process.env[varName]);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
});

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default value was provided`);
  }
  return value || defaultValue as string;
};
