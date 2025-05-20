import OpenAI from 'openai';
import { agentKitService } from './agentKitService.js';

class OpenAIService {
  private static instance: OpenAIService | null = null;
  private openai: OpenAI | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  public initialize(apiKey?: string): void {
    if (this.isInitialized) return;

    const key = apiKey || process.env.OPENAI_API_KEY;
    console.log('Initializing OpenAI service with API key:', key ? '***' + key.slice(-4) : 'undefined');
    
    if (!key) {
      console.warn('OPENAI_API_KEY is not set. OpenAI functionality will be disabled.');
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey: key });
      this.isInitialized = true;
      console.log('OpenAI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
    }
  }

  public isServiceInitialized(): boolean {
    return this.isInitialized && this.openai !== null;
  }

  async createCompletion(prompt: string, model: string = 'gpt-3.5-turbo-instruct', maxTokens: number = 1000): Promise<any> {
    if (!this.isServiceInitialized() || !this.openai) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const completion = await this.openai.completions.create({
        model,
        prompt,
        max_tokens: maxTokens,
      });
      return completion;
    } catch (error) {
      console.error('Error in createCompletion:', error);
      throw error;
    }
  }

  async createChatCompletion(messages: any[], model: string = 'gpt-3.5-turbo', maxTokens: number = 1000): Promise<any> {
    if (!this.isServiceInitialized() || !this.openai) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
      });
      return completion;
    } catch (error) {
      console.error('Error in createChatCompletion:', error);
      throw error;
    }
  }

  async needsOnChainData(prompt: string): Promise<boolean> {
    const onChainKeywords = [
      'balance', 'transaction', 'block', 'gas', 'fee', 'transfer', 'send', 'receive',
      'wallet', 'address', 'contract', 'token', 'nft', 'deploy', 'mint', 'burn',
      'approve', 'allowance', 'swap', 'liquidity', 'pool', 'stake', 'unstake', 'yield',
      'governance', 'proposal', 'vote', 'delegate', 'validator', 'bridge',
      'cross-chain', 'withdraw', 'deposit', 'borrow', 'lend', 'collateral',
      'leverage', 'short', 'long', 'position', 'order', 'trade', 'slippage', 'price',
      'oracle', 'aggregator', 'index', 'portfolio', 'rebalance', 'harvest', 'claim',
      'reward', 'incentive', 'airdrop', 'whitelist', 'kyc', 'permission', 'access',
      'role', 'admin', 'owner', 'upgrade', 'proxy', 'factory', 'router', 'dex', 'amm',
      'market', 'liquidation', 'health factor', 'debt', 'credit', 'flash loan', 'flashswap',
      'flash', 'arbitrage', 'mev', 'frontrun', 'backrun', 'sandwich', 'bundle', 'batching',
      'multicall', 'batch', 'aggregation', 'sign', 'signature', 'message', 'typed data',
      'eip712', 'eip-712', 'eip 712', 'personal sign', 'eth sign', 'contract interaction',
      'abi', 'function', 'event', 'log', 'filter', 'query', 'rpc', 'jsonrpc', 'infura',
      'alchemy', 'quicknode', 'endpoint', 'provider', 'web3', 'ethers', 'web3.js',
      'ethers.js', 'web3py', 'web3j', 'web3swift', 'web3dart', 'viem'
    ];

    const promptLower = prompt.toLowerCase();
    return onChainKeywords.some(keyword => 
      promptLower.includes(keyword.toLowerCase())
    );
  }
}

// Export a singleton instance
export const openaiService = OpenAIService.getInstance();
