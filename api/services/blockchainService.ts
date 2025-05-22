import { ethers } from 'ethers';
import { getEnv } from '../utils/env.js';

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  input: string;
  nonce: number;
  transactionIndex: number;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    const rpcUrl = getEnv('RPC_URL', '');
    if (!rpcUrl) {
      throw new Error('RPC_URL environment variable is not set');
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        // Test the connection
        await this.provider.getBlockNumber();
        this.isInitialized = true;
      } catch (error) {
        throw new Error(`Failed to initialize BlockchainService: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Get transactions for a specific address
   */
  async getTransactions(address: string, page = 1, limit = 10): Promise<{ transactions: Transaction[], total: number }> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    try {
      // Get the current block number
      const currentBlock = await this.provider.getBlockNumber();
      
      // For demo purposes, we'll fetch recent transactions
      // In a real implementation, you might want to use Alchemy's getAssetTransfers
      // or a similar API to get historical transactions
      const block = await this.provider.getBlock('latest', true);
      
      if (!block) {
        return { transactions: [], total: 0 };
      }

      // This is a simplified example - in a real app, you'd use Alchemy's API
      // to fetch transactions for the address
      const transactions: Transaction[] = [];
      
      // For demo purposes, return an empty array
      // In a real implementation, you would fetch actual transactions here
      
      return {
        transactions,
        total: 0
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<Transaction | null> {
    try {
      const tx = await this.provider.getTransaction(hash);
      if (!tx) return null;

      const receipt = await this.provider.getTransactionReceipt(hash);
      const block = await tx.blockNumber ? await this.provider.getBlock(tx.blockNumber) : null;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        timestamp: block?.timestamp || 0,
        blockNumber: tx.blockNumber || 0,
        gasUsed: receipt?.gasUsed.toString() || '0',
        gasPrice: tx.gasPrice?.toString() || '0',
        input: tx.data,
        nonce: tx.nonce,
        transactionIndex: tx.index
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const blockchainService = new BlockchainService();
