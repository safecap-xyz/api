import { AgentKit, CdpV2EvmWalletProvider } from '@coinbase/agentkit';
// import { CdpV2EvmWalletProvider } from '@coinbase/agentkit/wallets/cdp-v2-evm-wallet-provider';
import { CdpClient } from '@coinbase/cdp-sdk';
// import type { EvmAccount, EvmSmartAccount } from '@coinbase/cdp-sdk';

export interface IAgentKitService {
  initialize(): Promise<void>;
  getAgentKit(): Promise<AgentKit>;
  getAccountInfo(): Promise<{
    ownerAddress: string;
    smartAccountAddress: string;
  }>;
}

class AgentKitService implements IAgentKitService {
  private cdpClient: CdpClient;
  private agentKit: AgentKit | null = null;
  // private ownerAccount: EvmAccount | null = null;
  private smartAccount: EvmSmartAccount | null = null;
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
          name: 'AgentKitOwner',
          type: 'evm-server'
        });

        // 2. Create a smart account
        this.smartAccount = await this.cdpClient.evm.createSmartAccount({
          owner: this.ownerAccount.address,
          network: process.env.NETWORK || 'base-sepolia'
        });

        // 3. Initialize AgentKit with the CDP wallet provider
        const walletProvider = new CdpV2EvmWalletProvider({
          cdpClient: this.cdpClient,
          accountAddress: this.smartAccount.address
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
    if (!this.smartAccount) {
      await this.initialize();
    }
    if (!this.smartAccount) {
      throw new Error('Failed to get account information');
    }
    return {
      ownerAddress: this.ownerAccount.address,
      smartAccountAddress: this.smartAccount.address
    };
  }
}

export const agentKitService = new AgentKitService();