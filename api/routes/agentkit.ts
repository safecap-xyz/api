/**
 * AgentKit related routes
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentKitService } from '../services/agentKitService.js';
import { 
  AgentKitExecuteRequest,
  AgentKitAccountInfo,
  CreateSmartAccountRequest
} from '../types/agentkit.js';

let agentKitInitialized = false;

// Initialize AgentKit
agentKitService.initialize()
  .then(() => {
    console.log('AgentKit service initialized successfully');
    agentKitInitialized = true;
  })
  .catch(error => {
    console.error('Failed to initialize AgentKit service:', error);
  });

/**
 * Register AgentKit routes
 */
export function registerAgentKitRoutes(app: FastifyInstance) {
  // Get account information
  app.get('/api/agentkit/account', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!agentKitInitialized) {
      return reply.status(503).send({ error: 'AgentKit service is not initialized' });
    }
    
    try {
      const accountInfo = await agentKitService.getAccountInfo();
      return accountInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ error: 'Failed to get AgentKit account info', details: errorMessage });
    }
  });

  // Get network information
  app.get('/api/agentkit/network', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const networkInfo = await agentKitService.getNetworkInfo();
      return networkInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to get network information', 
        details: errorMessage 
      });
    }
  });

  // Get current gas price
  app.get('/api/agentkit/gas-price', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const gasPrice = await agentKitService.getGasPrice();
      return gasPrice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to get gas price', 
        details: errorMessage 
      });
    }
  });

  // Get current block number
  app.get('/api/agentkit/block-number', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const blockNumber = await agentKitService.getBlockNumber();
      return { blockNumber };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        error: 'Failed to get block number', 
        details: errorMessage 
      });
    }
  });

  // Get balance of an address
  app.get<{ Querystring: { address: string } }>('/api/agentkit/balance', async (req, reply) => {
    if (!agentKitInitialized) {
      return reply.status(503).send({ error: 'AgentKit service is not initialized' });
    }
    
    const { address } = req.query;
    
    if (!address) {
      return reply.status(400).send({ error: 'Address is required' });
    }
    
    try {
      const balance = await agentKitService.getBalance(address);
      return { balance };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        success: false, 
        error: 'Failed to get balance information',
        details: errorMessage 
      });
    }
  });

  // Execute an action
  app.post<{ Body: AgentKitExecuteRequest }>('/api/agentkit/execute', async (req, reply) => {
    if (!agentKitInitialized) {
      return reply.status(503).send({ error: 'AgentKit service is not initialized' });
    }
    
    const { action, params } = req.body;
    
    if (!action) {
      return reply.status(400).send({ error: 'Action is required' });
    }
    
    try {
      const result = await agentKitService.executeAction(action, params || {});
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.status(500).send({ 
        success: false, 
        error: `Failed to execute action ${action}`,
        details: errorMessage 
      });
    }
  });
}
