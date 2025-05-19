import { AgentKit } from '@coinbase/agentkit';
import { CdpClient } from '@coinbase/cdp-sdk';
import { CdpV2EvmWalletProvider } from '@coinbase/agentkit';

// Define interfaces for account types since they're not directly exported
interface EvmAccount {
  address: string;
  // Add other properties as needed
}

interface EvmSmartAccount {
  address: string;
  // Add other properties as needed
}

export interface IAgentKitService {
  initialize(): Promise<void>;
  getAgentKit(): Promise<AgentKit>;
  getAccountInfo(): Promise<{
    ownerAddress: string;
    smartAccountAddress: string;
  }>;
  executeAction<T = any>(action: string, params?: Record<string, any>): Promise<T>;
}

class AgentKitService implements IAgentKitService {
  private cdpClient: CdpClient;
  private agentKit: AgentKit | null = null;
  private ownerAccount: any | null = null;
  private smartAccount: any | null = null;
  private isInitializing: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.cdpClient = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID!,
      apiKeySecret: process.env.CDP_API_KEY_SECRET!,
      walletSecret: process.env.CDP_WALLET_SECRET!,
    });
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.isInitializing = true;
    this.initializationPromise = (async () => {
      try {
        // 1. Create an owner account if it doesn't exist
        this.ownerAccount = await this.cdpClient.evm.getOrCreateAccount({
          name: 'AgentKitOwner'
        });

        // 2. Create a smart account
        if (!this.ownerAccount) {
          throw new Error('Failed to create owner account');
        }
        this.smartAccount = await this.cdpClient.evm.createSmartAccount({
          owner: this.ownerAccount.address
        });

        // 3. Initialize AgentKit with the CDP wallet provider
        if (!this.smartAccount) {
          throw new Error('Failed to create smart account');
        }
        // Configure wallet provider using the correct method
        const walletProvider = await CdpV2EvmWalletProvider.configureWithWallet({
          apiKeyId: process.env.CDP_API_KEY_ID!,
          apiKeySecret: process.env.CDP_API_KEY_SECRET!,
          walletSecret: process.env.CDP_WALLET_SECRET!,
          networkId: process.env.NETWORK_ID || 'base-sepolia',
          // Optional: You can specify an existing wallet address if needed
          // address: this.smartAccount.address
        });

        this.agentKit = await AgentKit.from({ walletProvider });

        console.log('AgentKit initialized with smart account:', this.smartAccount.address);
      } catch (error) {
        console.error('Error initializing AgentKit:', error);
        // Reset state to allow retry
        this.isInitializing = false;
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async getAgentKit(): Promise<AgentKit> {
    if (!this.agentKit) {
      await this.initialize();
    }
    if (!this.agentKit) {
      throw new Error('AgentKit failed to initialize');
    }
    return this.agentKit;
  }

  async getAccountInfo() {
    if (!this.smartAccount || !this.ownerAccount) {
      await this.initialize();
    }
    if (!this.smartAccount || !this.ownerAccount) {
      throw new Error('Failed to get account information');
    }
    return {
      ownerAddress: this.ownerAccount.address,
      smartAccountAddress: this.smartAccount.address
    };
  }

  /**
   * Executes an action using AgentKit
   * @param action The name of the action to execute
   * @param params Optional parameters for the action
   * @returns The result of the action execution
   */
  async executeAction<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const agentKit = await this.getAgentKit();
      
      // Check if the action exists on the agentKit instance
      if (typeof agentKit[action as keyof typeof agentKit] !== 'function') {
        throw new Error(`Action '${action}' not found on AgentKit instance`);
      }
      
      // Execute the action directly on the agentKit instance
      const result = await (agentKit[action as keyof typeof agentKit] as Function)(params);
      
      return result as T;
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
      throw new Error(`Failed to execute action ${action}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const agentKitService = new AgentKitService();