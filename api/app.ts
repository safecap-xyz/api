import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { ethers } from 'ethers';

// Import configurations
import { loggerConfig, requestIdConfig } from './config/logger.js';
import { corsOptions } from './middleware/cors.js';
import { verifyEnvVariables } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { Campaign } from './types/index.js';

// Create Fastify instance with configurations
export function createApp(): FastifyInstance {
  // Check for missing environment variables
  const missingVars = verifyEnvVariables();
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars);
  }

  // Create Fastify instance with logger configuration
  const app: FastifyInstance = Fastify({
    logger: loggerConfig,
    ajv: {
      customOptions: {
        strict: 'log' as const,
        keywords: ['kind', 'modifier']
      }
    },
    ...requestIdConfig
  });

  // Log startup information
  app.log.info(`Starting in ${process.env.NODE_ENV === 'development' ? 'development' : 'production'} mode`);

  // Register CORS plugin
  app.register(fastifyCors, corsOptions);

  // Initialize in-memory database (example campaigns)
  app.decorate('db', {
    campaigns: [] as Campaign[]
  });

  // Load sample campaign data
  const loadSampleData = async (): Promise<void> => {
    try {
      const projectRoot = process.cwd();
      const campaignsPath = join(projectRoot, 'api/artifacts/Campaign.json');
      const campaignsData = await readFile(campaignsPath, 'utf-8');
      const campaigns = JSON.parse(campaignsData);
      
      app.db.campaigns = campaigns.map((campaign: any, index: number) => ({
        id: ethers.keccak256(ethers.toUtf8Bytes(`campaign-${index}`)).slice(0, 10),
        title: campaign.title || `Campaign ${index + 1}`,
        description: campaign.description || 'Sample campaign description',
        goal: campaign.goal || Math.floor(Math.random() * 10 + 1) * 1000,
        raised: campaign.raised || Math.floor(Math.random() * 10) * 100,
        creator: campaign.creator || ethers.Wallet.createRandom().address,
        backers: campaign.backers || Math.floor(Math.random() * 100),
        deadline: campaign.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      
      app.log.info(`Loaded ${app.db.campaigns.length} sample campaigns`);
    } catch (error) {
      app.log.error('Failed to load sample campaign data:', error);
      // Create some default campaigns if loading fails
      app.db.campaigns = [
        {
          id: ethers.keccak256(ethers.toUtf8Bytes('campaign-default')).slice(0, 10),
          title: 'Sample Campaign',
          description: 'This is a sample campaign',
          goal: 5000,
          raised: 2500,
          creator: ethers.Wallet.createRandom().address,
          backers: 25,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      app.log.info('Created default sample campaign');
    }
  };

  // Register routes
  app.register(async (instance) => {
    await registerRoutes(instance);
  });

  // Load sample data when the app starts
  app.ready().then(() => {
    loadSampleData().catch(err => {
      app.log.error('Error loading sample data:', err);
    });
  });

  return app;
}
