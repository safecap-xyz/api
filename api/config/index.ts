import { NetworkConfigs } from '../types/index.js';

// Network configuration
export const NETWORK_CONFIG: NetworkConfigs = {
  // Network configurations would be added here based on the original file
  // This is a placeholder for any network-specific configurations
};

// Define allowed origins
export const allowedOrigins = [
  'https://safecap.xyz',
  'https://www.safecap.xyz',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Required environment variables for CDP
export const requiredVars = ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'CDP_WALLET_SECRET'];
