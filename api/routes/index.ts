import { FastifyInstance } from 'fastify';
import agentKitRoutes from './agentkit.js';
import cdpRoutes from './cdp.js';
import imageRoutes from './images.js';
import openaiRoutes from './openai.js';
import mastraRoutes from './mastra.js';

// Register all routes
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.register(agentKitRoutes);
  app.register(cdpRoutes);
  app.register(imageRoutes);
  app.register(openaiRoutes);
  app.register(mastraRoutes);
  
  // Add a simple health check route
  app.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
