/**
 * Environment variable utilities
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Get environment variable with validation
 * @param key Environment variable name
 * @param defaultValue Optional default value
 * @param required If true, throws error when variable is missing
 */
export function getEnv(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key] || defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
}

/**
 * Get environment variable as number
 * @param key Environment variable name
 * @param defaultValue Optional default value
 */
export function getEnvAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue !== undefined ? defaultValue : 0;
  }
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? (defaultValue !== undefined ? defaultValue : 0) : parsed;
}

/**
 * Get environment variable as boolean
 * @param key Environment variable name
 * @param defaultValue Optional default value
 */
export function getEnvAsBoolean(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  return ['true', '1', 'yes'].includes(value.toLowerCase());
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getEnv('NODE_ENV', 'development').toLowerCase() === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return getEnv('NODE_ENV', 'development').toLowerCase() === 'production';
}
