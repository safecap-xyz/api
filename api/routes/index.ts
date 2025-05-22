/**
 * Routes index - exports all route registration functions
 */
import { FastifyInstance } from 'fastify';
import { registerAgentKitRoutes } from './agentkit.js';
import { registerCampaignRoutes } from './campaigns.js';
import { registerOpenAIRoutes } from './openai.js';

/**
 * Register all application routes
 * @param app Fastify instance
 */
export function registerRoutes(app: FastifyInstance) {
  // Register route handlers by category
  registerAgentKitRoutes(app);
  registerCampaignRoutes(app);
  registerOpenAIRoutes(app);
  
  // Define a health check route
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
