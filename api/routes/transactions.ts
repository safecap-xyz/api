/**
 * Transaction related routes
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blockchainService } from '../services/blockchainService.js';
import { ethers } from 'ethers';

interface TransactionQuery {
  page?: number;
  limit?: number;
}

interface TransactionParams {
  address: string;
}

// Initialize blockchain service
let isBlockchainServiceReady = false;
blockchainService.initialize()
  .then(() => {
    console.log('Blockchain service initialized successfully');
    isBlockchainServiceReady = true;
  })
  .catch(error => {
    console.error('Failed to initialize blockchain service:', error);
  });

export function registerTransactionRoutes(app: FastifyInstance) {
  // Health check for blockchain service
  app.get('/api/transactions/health', async (req: FastifyRequest, reply: FastifyReply) => {
    return {
      status: isBlockchainServiceReady ? 'ok' : 'initializing',
      timestamp: new Date().toISOString()
    };
  });

  // Get transactions for a specific address
  app.get<{ Params: TransactionParams; Querystring: TransactionQuery }>(
    '/api/transactions/address/:address',
    async (request, reply) => {
      if (!isBlockchainServiceReady) {
        return reply.status(503).send({ 
          error: 'Blockchain service is initializing',
          status: 'pending'
        });
      }

      const { address } = request.params;
      const { page = 1, limit = 10 } = request.query;

      // Validate address
      if (!ethers.isAddress(address)) {
        return reply.status(400).send({ 
          error: 'Invalid Ethereum address',
          details: 'The provided address is not a valid Ethereum address'
        });
      }

      try {
        const { transactions, total } = await blockchainService.getTransactions(
          address,
          Number(page),
          Number(limit)
        );

        return {
          address,
          transactions,
          page: Number(page),
          limit: Number(limit),
          total,
          hasMore: (Number(page) * Number(limit)) < total
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching transactions:', error);
        return reply.status(500).send({ 
          error: 'Failed to fetch transactions', 
          details: errorMessage 
        });
      }
    }
  );

  // Get transaction by hash
  app.get<{ Params: { hash: string } }>(
    '/api/transactions/:hash',
    async (request, reply) => {
      if (!isBlockchainServiceReady) {
        return reply.status(503).send({ 
          error: 'Blockchain service is initializing',
          status: 'pending'
        });
      }

      const { hash } = request.params;

      try {
        const transaction = await blockchainService.getTransaction(hash);
        
        if (!transaction) {
          return reply.status(404).send({ 
            error: 'Transaction not found',
            details: 'The requested transaction was not found on the blockchain'
          });
        }

        return transaction;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching transaction:', error);
        return reply.status(500).send({ 
          error: 'Failed to fetch transaction', 
          details: errorMessage 
        });
      }
    }
  );
}
