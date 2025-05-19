// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
  // Optionally exit with a non-zero code
  // process.exit(1);
});

// Load environment variables first
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// These imports must come after environment variables are loaded
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyCors, { type FastifyCorsOptions } from '@fastify/cors';
import { CdpClient } from '@coinbase/cdp-sdk';
import { Client } from "@gradio/client";
import { ethers } from 'ethers';
import { readFile } from 'fs/promises';

// Debug current working directory
console.log('Current working directory:', process.cwd());

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('Current file directory:', __dirname);

// Try multiple possible .env file locations
const possibleEnvPaths = [
  resolve(process.cwd(), '.env'),                // Project root
  resolve(__dirname, '../../.env'),            // Two levels up from api/
  resolve(process.cwd(), '..', '.env'),        // One level up
  resolve(process.cwd(), '../..', '.env'),     // Two levels up
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

// Debug log environment loading
console.log('Environment variables loaded:', Object.keys(process.env).filter(key => 
  key.startsWith('CDP_') || 
  key.startsWith('ALCHEMY_') ||
  key === 'NODE_ENV'
));

// Verify CDP environment variables are set
const requiredVars = ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'CDP_WALLET_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  console.log('Current CDP_API_KEY_ID exists:', 'CDP_API_KEY_ID' in process.env);
  console.log('Current CDP_API_KEY_SECRET exists:', 'CDP_API_KEY_SECRET' in process.env);
  console.log('Current CDP_WALLET_SECRET exists:', 'CDP_WALLET_SECRET' in process.env);
}

import { join } from 'path';

// ... existing code ...

// Network configuration
interface NetworkConfig {
  rpcUrl: string;
  blockExplorerUrl: string;
  chainId: number;
}

interface NetworkConfigs {
  [key: string]: NetworkConfig;
}

// Campaign interface
interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  creator: string;
  backers: number;
  deadline: string;
}

// User Operation Request interface
interface UserOperationRequest {
  network?: string;
  smartAccountAddress?: string;
  calls?: any[];
  ownerAddress?: string;
}

// ... existing code ...

// Create Fastify instance with environment-based logging
const isDevelopment = process.env.NODE_ENV === 'development';

// Configure Fastify with proper TypeScript types
const app: FastifyInstance = Fastify({
  logger: isDevelopment ? {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : { level: 'info' },
  ajv: {
    customOptions: {
      strict: 'log' as const,  // Use 'as const' to satisfy TypeScript
      keywords: ['kind', 'modifier']
    }
  },
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId: () => Date.now().toString(36) + Math.random().toString(36).substring(2)
});

// Log startup information
app.log.info(`Starting in ${isDevelopment ? 'development' : 'production'} mode`);

// Declare custom properties for fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      campaigns: Campaign[];
    };
  }
}

// ... existing code ...

const NETWORK_CONFIG: NetworkConfigs = {
  // ... existing code ...
};

// ... existing code ...
// Initialize CDP client with environment variable validation
let cdpClient: CdpClient | null = null;

try {
  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET || !process.env.CDP_WALLET_SECRET) {
    console.warn('Missing one or more required CDP environment variables. CDP functionality will be disabled.');
    console.warn('Please set CDP_API_KEY_ID, CDP_API_KEY_SECRET, and CDP_WALLET_SECRET in your .env file');
  } else {
    cdpClient = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    });
    console.log('CDP client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize CDP client:', error);
  console.warn('Continuing without CDP functionality');
}

// Define interfaces for request bodies
interface SampleUserOperationRequest {
  network?: string;
  type?: string;
  name?: string;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

app.post<{ Body: SampleUserOperationRequest }>('/api/sample-user-operation', async (req, reply) => {
  // ... existing code ...
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Error sending sample user operation:', error);
    reply.code(500).send({ error: (error as Error).message || 'Failed to send sample user operation' });
  }
});

// API Routes for SafeCap
app.get('/api/campaigns', (req: FastifyRequest, reply: FastifyReply) => {
  console.log('CORS headers:', reply.getHeaders());
  reply.send(app.db.campaigns);
})

app.get('/api/campaigns/:id', (req: FastifyRequest<{
  Params: { id: string }
}>, reply: FastifyReply) => {
  // ... existing code ...
})

app.post('/api/campaigns', (req: FastifyRequest<{
  Body: Omit<Campaign, 'id' | 'backers' | 'raised'>
}>, reply: FastifyReply) => {
  // ... existing code ...
})

app.post('/api/campaigns/:id/donate', (req: FastifyRequest<{
  Params: { id: string },
  Body: { amount: number }
}>, reply: FastifyReply) => {
  // ... existing code ...
})

// CDP Routes
app.get('/api/list-accounts', async (req: FastifyRequest<{
  Querystring: { type?: string }
}>, reply: FastifyReply) => {
  // ... existing code ...
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Error listing accounts:', error);
    reply.code(500).send({ error: (error as Error).message || 'Failed to list accounts' });
  }
});

app.post('/api/send-user-operation', async (req: FastifyRequest<{
  Body: UserOperationRequest
}>, reply: FastifyReply) => {
  // ... existing code ...
  try {
    // ... existing code ...
  } catch (error) {
    console.error('Error sending user operation:', error);
    reply.code(500).send({ error: (error as Error).message || 'Failed to send user operation' });
  }
});

// Image generation types
interface GenerateImageRequest {
  refImageUrl1: string;
  refImageUrl2: string;
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  ref_res?: number;
  num_steps?: number;
  guidance?: number;
  true_cfg?: number;
  cfg_start_step?: number;
  cfg_end_step?: number;
  neg_prompt?: string;
  neg_guidance?: number;
  first_step_guidance?: number;
  ref_task1?: string;
  ref_task2?: string;
}

interface GenerateImageResponse {
  data: string; // Base64 encoded image or URL
  success: boolean;
  metadata?: Record<string, unknown>;
}

app.post<{ Body: GenerateImageRequest }>('/api/generate-image', async (req, reply) => {
  const {
    refImageUrl1,
    refImageUrl2,
    prompt,
    seed = 7698454872441022867,
    width = 1024,
    height = 1024,
    ref_res = 512,
    num_steps = 12,
    guidance = 3.5,
    true_cfg = 1,
    cfg_start_step = 0,
    cfg_end_step = 0,
    neg_prompt = '',
    neg_guidance = 1,
    first_step_guidance = 0,
    ref_task1 = 'id',
    ref_task2 = 'ip',
  } = req.body;

  // Validate required fields
  if (!refImageUrl1 || !refImageUrl2 || !prompt) {
    return reply.status(400).send({
      error: 'Missing required fields',
      details: 'refImageUrl1, refImageUrl2, and prompt are required',
    });
  }

  try {
    req.log.info('Fetching reference images...');
    const [refImage1Blob, refImage2Blob] = await Promise.all([
      (await fetch(refImageUrl1)).blob(),
      (await fetch(refImageUrl2)).blob(),
    ]);

    req.log.info('Connecting to Gradio client...');
    const client = await Client.connect("ByteDance/DreamO");

    req.log.info('Generating image...');
    const result = await client.predict("/generate_image", {
      ref_image1: refImageUrl1, // Using URL directly as per Gradio client requirements
      ref_image2: refImageUrl2,
      ref_task1,
      ref_task2,
      prompt,
      seed,
      width,
      height,
      ref_res,
      num_steps,
      guidance,
      true_cfg,
      cfg_start_step,
      cfg_end_step,
      neg_prompt,
      neg_guidance,
      first_step_guidance,
    });

    const response: GenerateImageResponse = {
      data: result.data,
      success: true,
      metadata: {
        model: "ByteDance/DreamO",
        timestamp: new Date().toISOString(),
        parameters: {
          seed,
          width,
          height,
          steps: num_steps,
          guidance_scale: guidance,
        },
      },
    };

    reply.send(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    req.log.error('Error in generate-image:', error);
    
    reply.status(500).send({ 
      error: 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      success: false,
    });
  }
});

// Network types supported by CDP SDK
type NetworkType = 'base-sepolia' | 'ethereum-sepolia';

interface CreateWalletRequest {
  type: string;
  name: string;
  network?: NetworkType;
}

// Smart Account Types
interface CreateSmartAccountRequest {
  ownerAddress: string;
  network?: NetworkType;
}

interface CreateSmartAccountResponse {
  smartAccountAddress: string;
  ownerAddress: string;
  network: string;
}

// CDP Wallet Toolkit API Routes
app.post<{ Body: CreateSmartAccountRequest }>('/api/create-smart-account', async (req, reply) => {
  const { ownerAddress, network = 'base-sepolia' } = req.body;

  if (!cdpClient) {
    return reply.status(503).send({ 
      error: 'Service Unavailable',
      details: 'CDP client is not initialized. Please check your environment variables.'
    });
  }

  try {
    if (!ownerAddress) {
      return reply.status(400).send({ 
        error: 'Bad Request',
        details: 'Owner address is required' 
      });
    }

    // Ensure the address is properly formatted and has the correct type
    let formattedAddress: `0x${string}`;
    try {
      formattedAddress = ethers.getAddress(ownerAddress);
    } catch (error) {
      return reply.status(400).send({
        error: 'Invalid Address',
        details: 'The provided owner address is not a valid Ethereum address'
      });
    }

    req.log.info(`Creating smart account with owner: ${formattedAddress} on network: ${network}`);

    // First, try to get the owner account
    let ownerAccount;
    try {
      req.log.info('Fetching owner account for address:', formattedAddress);
      ownerAccount = await cdpClient.evm.getAccount({ address: formattedAddress });
      req.log.info('Owner account found:', ownerAccount);
    } catch (error) {
      req.log.info('Owner account not found, will create a new one');
      // If the owner account doesn't exist or can't be retrieved in this session,
      // create a new account to use as the owner
      const timestamp = Date.now().toString();
      const validName = `owner${timestamp.substring(timestamp.length - 8)}`;
      req.log.info('Creating new owner account with name:', validName);

      ownerAccount = await cdpClient.evm.getOrCreateAccount({
        name: validName
      });
      req.log.info('Created new owner account:', ownerAccount.address);
    }

    // Create a smart account using the owner account object
    req.log.info('Creating smart account with owner account:', ownerAccount);
    // Note: Removed network from options as it's not a valid property
    const result = await cdpClient.evm.createSmartAccount({
      owner: ownerAccount
    });

    req.log.info('Smart account created:', result.address);

    const response: CreateSmartAccountResponse = {
      smartAccountAddress: result.address,
      ownerAddress: ownerAccount.address,
      network
    };

    reply.send(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    req.log.error('Error creating smart account:', error);
    
    reply.status(500).send({ 
      error: 'Failed to create smart account',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// CDP Wallet Toolkit API Routes
app.post<{ Body: CreateWalletRequest }>('/api/create-wallet-direct', async (req, reply) => {
  const { type, name, network = 'base-sepolia' } = req.body;

  if (!cdpClient) {
    reply.status(503).send({ 
      error: 'Service Unavailable',
      details: 'CDP client is not initialized. Please check your environment variables.'
    });
    return;
  }

  try {
    console.log(`Creating ${type} account with name: ${name}`);

    let newAccount;
    let transactionHash = '';

    if (type === 'EVM') {
      // Create EVM account
      newAccount = await cdpClient.evm.getOrCreateAccount({ name });
      console.log('EVM account created:', newAccount.address);

      // Request faucet funds
      console.log('Requesting faucet funds for network:', network);
      const faucetResult = await cdpClient.evm.requestFaucet({
        address: newAccount.address,
        network,
        token: "eth",
      });
      transactionHash = faucetResult.transactionHash;
      console.log('Faucet transaction hash:', transactionHash);
    } else if (type === 'SOLANA') {
      // Create Solana account
      newAccount = await cdpClient.solana.getOrCreateAccount({ name });
      console.log('Solana account created:', newAccount.address);

      // Request Solana faucet funds
      console.log('Requesting Solana faucet funds');
      const faucetResult = await cdpClient.solana.requestFaucet({
        address: newAccount.address,
        token: "sol"
      });
      transactionHash = faucetResult.signature || '';
      console.log('Solana faucet transaction signature:', transactionHash);
    } else {
      throw new Error(`Unsupported account type: ${type}`);
    }

    reply.send({
      account: newAccount,
      transactionHash
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating wallet:', error);
    reply.status(500).send({ 
      error: 'Failed to create wallet',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
  // ... existing code ...
})

// Server startup function with comprehensive error handling
const startServer = async (): Promise<string> => {
  try {
    // Configure CORS based on environment
    const corsOptions: FastifyCorsOptions = {
      // In production, only allow specific origins
      // In development, allow all origins
      origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://your-production-domain.com',
            'https://www.your-production-domain.com',
            // Add other production domains as needed
          ]
        : true, // Allow all in non-production
      
      // Allowed HTTP methods
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      
      // Allowed request headers
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-Id',
        'X-Forwarded-For',
        'X-Real-IP'
      ],
      
      // Exposed response headers
      exposedHeaders: [
        'Content-Length',
        'Content-Range',
        'X-Total-Count'
      ],
      
      // Allow credentials (cookies, authorization headers)
      credentials: true,
      
      // Cache preflight requests for 24 hours
      maxAge: 86400,
      
      // Don't pass the CORS preflight response to the route handler
      preflightContinue: false,
      
      // Set the status code for OPTIONS requests
      optionsSuccessStatus: 204,
      
      // Enable CORS for all routes
      hideOptionsRoute: false
    };

    // Register CORS with the configured options
    await app.register(fastifyCors, corsOptions);
    
    // Add a route to handle OPTIONS requests (preflight)
    app.options('*', async (request, reply) => {
      reply.send();
    });

    // Health check endpoint
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start the server
    const address = await app.listen({
      port: 3000,
      host: '0.0.0.0',
      listenTextResolver: (addr) => `Server is running at ${addr}`
    });

    console.log(`\n🚀 Server started successfully`);
    console.log(`   - Environment: ${isDevelopment ? 'development' : 'production'}`);
    console.log(`   - Node version: ${process.version}`);
    console.log(`   - CDP Client: ${cdpClient ? '✅ Initialized' : '❌ Not available'}`);
    console.log(`   - API Documentation: ${address}/documentation\n`);
    
    return address;
  } catch (error) {
    console.error('\n❌ Fatal error during server startup:');
    
    if (error instanceof Error) {
      console.error(`   - Error: ${error.name}: ${error.message}`);
      if (error.stack) {
        console.error('   - Stack trace:');
        console.error(error.stack.split('\n').slice(0, 3).map(line => `     ${line}`).join('\n') + '\n     ...');
      }
    } else {
      console.error('   - Unknown error:', error);
    }
    
    // Give logs time to flush before exiting
    await new Promise(resolve => setTimeout(resolve, 100));
    process.exit(1);
  }
};

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  startServer()
    .catch(error => {
      console.error('Fatal error in startup sequence:', error);
      process.exit(1);
    });
}

// Export the Fastify server for serverless environments
export default async function handler(req: any, reply: any) {
  await app.ready();
  app.server.emit('request', req, reply);
}