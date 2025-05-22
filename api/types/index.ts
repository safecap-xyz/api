// Export all types
export * from './agentkit.js';
export * from './campaign.js';
export * from './openai.js';
export * from './requests.js';
export * from './responses.js';

// Add Fastify custom module declarations
import { Campaign } from './campaign.js';

// Declare custom properties for fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      campaigns: Campaign[];
    };
  }
}
