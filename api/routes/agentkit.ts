import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { agentKitService } from '../../services/agentKitService.js';
import { handleError } from '../utils/error-handler.js';
import { 
  SampleUserOperationRequest,
  AgentKitAccountInfo,
  AgentKitExecuteRequest
} from '../types/index.js';

export default async function(app: FastifyInstance) {
  // Flag to track if AgentKit is initialized
  // This would be determined during app startup in a real implementation
  let agentKitInitialized = false;
  
  try {
    // Attempt to initialize the AgentKit service
    agentKitInitialized = true;
    console.log('AgentKit service initialized');
  } catch (error) {
    console.error('Failed to initialize AgentKit service:', error);
  }

  // Sample user operation endpoint
  app.post<{ Body: SampleUserOperationRequest }>('/api/sample-user-operation', async (req, reply) => {
    try {
      const { network = 'base-sepolia', type = 'evm' } = req.body;

      if (!agentKitInitialized) {
        return reply.status(503).send({ 
          error: 'AgentKit service is not initialized', 
          details: 'Please check the environment variables for CDP credentials' 
        });
      }

      // Mock sample operation for demonstration purposes
      const result = {
        operation: {
          id: `op-${Date.now()}`,
          network,
          type,
          status: 'created'
        },
        success: true
      };
      return reply.send(result);
    } catch (error) {
      handleError(error, reply);
    }
  });

  // AgentKit account info endpoint
  app.post<{ Body: AgentKitAccountInfo }>('/api/agentkit/account-info', async (req, reply) => {
    try {
      const { ownerAddress, smartAccountAddress } = req.body;

      if (!agentKitInitialized) {
        return reply.status(503).send({ 
          error: 'AgentKit service is not initialized', 
          details: 'Please check the environment variables for CDP credentials' 
        });
      }

      // Mock account info
      const accountInfo = {
        ownerAddress,
        smartAccountAddress,
        balance: '0.0',
        network: 'base-sepolia',
        success: true
      };
      return reply.send(accountInfo);
    } catch (error) {
      handleError(error, reply);
    }
  });

  // AgentKit execute endpoint
  app.post<{ Body: AgentKitExecuteRequest }>('/api/agentkit/execute', async (req, reply) => {
    try {
      const { action, params } = req.body;

      if (!agentKitInitialized) {
        return reply.status(503).send({ 
          error: 'AgentKit service is not initialized', 
          details: 'Please check the environment variables for CDP credentials' 
        });
      }

      // Mock execute action
      const result = {
        actionId: `action-${Date.now()}`,
        action,
        params: params || {},
        status: 'executed'
      };
      
      return reply.send({
        success: true,
        result
      });
    } catch (error) {
      handleError(error, reply);
    }
  });
}
