/**
 * Main API entry point
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the project root directory
const projectRoot = resolve(__dirname, '..');

// Load environment variables from the project root
const envPath = resolve(projectRoot, '.env');
config({ path: envPath });

// Import modular components
import { registerRoutes } from './routes/index.js';
import { isDevelopment, getEnv } from './utils/env.js';
import type { Campaign } from './types/campaigns.js';

// Log environment status
console.log(`Starting in ${isDevelopment() ? 'development' : 'production'} mode`);

// Create Fastify instance with logging configuration
const app: FastifyInstance = Fastify({
  logger: {
    level: isDevelopment() ? 'debug' : 'info',
    transport: isDevelopment() ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  },
  ajv: {
    customOptions: {
      strict: 'log',
      coerceTypes: true
    }
  }
});

// Database mock for development
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      campaigns: Campaign[];
    }
  }
}

// Add in-memory database for development
app.decorate('db', {
  campaigns: [
    {
      id: '1',
      title: 'First Campaign',
      description: 'This is the first campaign',
      goal: 1000,
      raised: 500,
      creator: '0x123...',
      backers: 5,
      deadline: '2025-12-31'
    }
  ]
});

// Register CORS plugin
app.register(fastifyCors, {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Register all routes
registerRoutes(app);

// Server startup function
async function startServer(): Promise<string> {
  try {
    const port = getEnv('PORT', '3000');
    const host = getEnv('HOST', '0.0.0.0');
    
    const address = await app.listen({ port: parseInt(port), host });
    console.log(`Server listening at ${address}`);
    return address;
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Start server when running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

// Export for serverless environments
export const handler = app;
