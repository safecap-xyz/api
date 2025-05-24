import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { cdpService } from '../services/index.js';
import { allowedOrigins } from '../config/index.js';
import type {
  CreateSmartAccountRequest,
  CreateWalletRequest,
  UserOperationRequest,
  SampleUserOperationRequest
} from '../types/index.js';

export default async function cdpRoutes(fastify: FastifyInstance) {
  // List accounts
  fastify.get('/api/list-accounts', async (req: FastifyRequest<{
    Querystring: { type?: string }
  }>, reply: FastifyReply) => {
    if (!cdpService.isAvailable()) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        details: 'CDP client is not initialized. Please check your environment variables.'
      });
    }

    try {
      // Implementation would depend on CDP SDK capabilities
      // This is a placeholder for the actual account listing logic
      reply.send({ accounts: [] });
    } catch (error) {
      console.error('Error listing accounts:', error);
      reply.code(500).send({ error: (error as Error).message || 'Failed to list accounts' });
    }
  });

  // Send user operation
  fastify.post('/api/send-user-operation', async (req: FastifyRequest<{
    Body: UserOperationRequest
  }>, reply: FastifyReply) => {
    if (!cdpService.isAvailable()) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        details: 'CDP client is not initialized. Please check your environment variables.'
      });
    }

    try {
      // Implementation would depend on specific user operation logic
      // This is a placeholder for the actual user operation logic
      reply.send({ success: true });
    } catch (error) {
      console.error('Error sending user operation:', error);
      reply.code(500).send({ error: (error as Error).message || 'Failed to send user operation' });
    }
  });

  // Sample user operation
  fastify.post('/api/sample-user-operation', async (req: FastifyRequest<{
    Body: SampleUserOperationRequest
  }>, reply: FastifyReply) => {
    if (!cdpService.isAvailable()) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        details: 'CDP client is not initialized. Please check your environment variables.'
      });
    }

    try {
      // Implementation would depend on specific sample user operation logic
      // This is a placeholder for the actual sample user operation logic
      reply.send({ success: true });
    } catch (error) {
      console.error('Error sending sample user operation:', error);
      reply.code(500).send({ error: (error as Error).message || 'Failed to send sample user operation' });
    }
  });

  // Create smart account
  fastify.post('/api/create-smart-account', async (req: FastifyRequest<{
    Body: CreateSmartAccountRequest
  }>, reply: FastifyReply) => {
    const { ownerAddress, network = 'base-sepolia' } = req.body;

    if (!cdpService.isAvailable()) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        details: 'CDP client is not initialized. Please check your environment variables.'
      });
    }

    try {
      // Validate request
      if (!ownerAddress) {
        return reply.status(400).send({
          error: 'Bad Request',
          details: 'Owner address is required'
        });
      }

      req.log.info(`Creating smart account with owner: ${ownerAddress} on network: ${network}`);

      const result = await cdpService.createSmartAccount({ ownerAddress, network });

      req.log.info('Smart account created successfully');
      return reply.send(result);

    } catch (error: any) {
      req.log.error('Error in create-smart-account endpoint:', error);

      // Handle known error cases
      if (error.message?.includes('invalid address')) {
        return reply.status(400).send({
          error: 'Invalid Address',
          details: 'The provided address is not a valid Ethereum address'
        });
      }

      // Default error response
      return reply.status(500).send({
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development'
          ? error.message
          : 'Failed to create smart account. Please try again later.'
      });
    }
  });

  // Create wallet direct
  fastify.post('/api/create-wallet-direct', {
    // Add CORS headers explicitly for this route
    preHandler: (request, reply, done) => {
      const origin = request.headers.origin || '';
      const requestOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

      reply.header('Access-Control-Allow-Origin', requestOrigin);
      reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      reply.header('Access-Control-Allow-Credentials', 'true');

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return reply.send();
      }

      done();
    }
  }, async (req: FastifyRequest<{
    Body: CreateWalletRequest
  }>, reply: FastifyReply) => {
    if (!cdpService.isAvailable()) {
      return reply.status(503).send({
        error: 'Service Unavailable',
        details: 'CDP client is not initialized. Please check your environment variables.'
      });
    }

    try {
      const result = await cdpService.createWallet(req.body);
      reply.send(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating wallet:', error);
      reply.status(500).send({
        error: 'Failed to create wallet',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });
}
