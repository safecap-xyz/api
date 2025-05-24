import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // CORS test endpoint
  fastify.get('/api/test-cors', async (request, reply) => {
    return { message: 'CORS test successful' };
  });

  // Root endpoint
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    return {
      message: 'SafeCap API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  });
}
