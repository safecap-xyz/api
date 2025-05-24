// Environment setup
import { setupUnhandledRejection, loadEnvironment, validateEnvironment, createCorsOptions } from './utils/index.js';

// Setup unhandled rejection handler
setupUnhandledRejection();

// Load environment variables first
loadEnvironment();

// Debug current working directory
console.log('Current working directory:', process.cwd());

// Validate environment variables
validateEnvironment();

// These imports must come after environment variables are loaded
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';

// Import route modules
import { campaignRoutes, cdpRoutes, imageRoutes, healthRoutes } from './routes/index.js';

// Import services to initialize them
import './services/index.js';

// Import types for Fastify module augmentation
import type { Campaign } from './types/index.js';

// Use Fastify's default logger with minimal configuration
const app: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    // Disable transport in all environments to avoid pino-pretty issues
    transport: undefined,
    // Basic formatting
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    formatters: {
      level: (label: string) => ({ level: label })
    }
  },
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
app.log.info(`Starting in ${process.env.NODE_ENV === 'development' ? 'development' : 'production'} mode`);

// Declare custom properties for fastify instance (keeping for backward compatibility)
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      campaigns: Campaign[];
    };
  }
}

// Initialize in-memory database for backward compatibility
app.decorate('db', {
  campaigns: []
});

// Server startup function with comprehensive error handling
const startServer = async (): Promise<string> => {
  try {
    // Configure and register CORS
    const corsOptions = createCorsOptions();
    await app.register(fastifyCors, corsOptions);

    // Register route modules
    await app.register(healthRoutes);
    await app.register(campaignRoutes);
    await app.register(cdpRoutes);
    await app.register(imageRoutes);

    // Log startup information
    console.log(`Starting server in ${process.env.NODE_ENV === 'development' ? 'development' : 'production'} mode`);
    console.log('Environment variables loaded:', Object.keys(process.env).filter(key =>
      key === 'NODE_ENV' ||
      key.startsWith('CDP_') ||
      key.startsWith('ALCHEMY_')
    ));

    // Start the server
    const address = await app.listen({
      port: 3000,
      host: '0.0.0.0',
      listenTextResolver: (addr) => `Server is running at ${addr}`
    });

    console.log(`\n🚀 Server started successfully`);
    console.log(`   - Environment: ${process.env.NODE_ENV === 'development' ? 'development' : 'production'}`);
    console.log(`   - Node version: ${process.version}`);
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
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

// Export the Fastify server for serverless environments
export default async function handler(req: any, reply: any) {
  await app.ready();
  app.server.emit('request', req, reply);
}
