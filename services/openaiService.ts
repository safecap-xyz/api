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

  async createChatCompletion(
    messages: any[],
    model: string = 'gpt-3.5-turbo',
    maxTokens: number = 1000,
    functions?: any[],
    functionCall: 'none' | 'auto' | { name: string } = 'auto'
  ): Promise<any> {
    if (!this.isServiceInitialized() || !this.openai) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        functions,
        function_call: functionCall,
      });
      
      const response = completion.choices[0].message;
      
      // Handle function calling
      if (response.function_call) {
        const functionName = response.function_call.name;
        const functionArgs = JSON.parse(response.function_call.arguments || '{}');
        
        // Call the appropriate function based on the name
        const functionResponse = await this.executeFunction(functionName, functionArgs);
        
        // Add the function response to the messages
        messages.push({
          role: 'assistant',
          content: null,
          function_call: response.function_call
        });
        
        messages.push({
          role: 'function',
          name: functionName,
          content: JSON.stringify(functionResponse)
        });
        
        // Get a new completion with the function response
        return this.createChatCompletion(messages, model, maxTokens, functions, functionCall);
      }
      
      return completion;
    } catch (error) {
      console.error('Error in createChatCompletion:', error);
      throw error;
    }
  }
  
  // Execute a function based on its name and arguments
  private async executeFunction(name: string, args: Record<string, any>): Promise<any> {
    try {
      switch (name) {
        case 'get_balance':
          const balance = await agentKitService.getBalance(args.address);
          return { 
            address: args.address, 
            balance: balance,
            unit: 'ETH',
            timestamp: new Date().toISOString()
          };
          
        case 'get_gas_price':
          const gasPrice = await agentKitService.getGasPrice();
          return gasPrice;
          
        case 'get_block_number':
          const blockNumber = await agentKitService.getBlockNumber();
          return { blockNumber };
          
        case 'get_network_info':
          const networkInfo = await agentKitService.executeAction('getNetworkInfo');
          return networkInfo;
          
        default:
          throw new Error(`Function ${name} not implemented`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error executing function ${name}:`, errorMessage);
      return { error: errorMessage };
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
