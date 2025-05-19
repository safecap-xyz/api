import { ethers } from 'ethers';

// Import types from the agentkit package
import type { AgentKit as AgentKitBase } from '@coinbase/agentkit';
import type { CdpV2EvmWalletProvider as WalletProviderType } from '@coinbase/agentkit';
import type { CdpClient as CdpClientType } from '@coinbase/cdp-sdk';

// Import the packages using dynamic imports to handle ESM modules
const agentkit = await import('@coinbase/agentkit');
const cdpsdk = await import('@coinbase/cdp-sdk');

// Extract the required classes
const { AgentKit: AgentKitClass, CdpV2EvmWalletProvider: WalletProvider } = agentkit;
const { CdpClient: CdpClientClass } = cdpsdk;

// Extend the AgentKit type to include the executeAction method
type AgentKit = AgentKitBase & {
  executeAction<T = any>(
    action: string, 
    params?: Record<string, any>
  ): Promise<T>;
};

type CdpV2EvmWalletProvider = WalletProviderType;
type CdpClient = CdpClientType;

// Network information interface
interface NetworkInfo {
  chainId: string;
  name: string;
  isTestnet: boolean;
  chainIdNumber: number;
}

// Account information interface
interface AccountInfo {
  ownerAddress: string;
  smartAccountAddress: string;
  isInitialized: boolean;
}

// Gas price information interface
interface GasPriceInfo {
  gasPrice: string;
  formatted: string;
}

class AgentKitService {
  private cdpClient: CdpClient | null = null;
  private agentKit: AgentKit | null = null;
  private walletProvider: CdpV2EvmWalletProvider | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Initialize CDP Client
        this.cdpClient = new CdpClientClass({
          apiKeyId: process.env.CDP_API_KEY_ID || '',
          apiKeySecret: process.env.CDP_API_KEY_SECRET || '',
          walletSecret: process.env.CDP_WALLET_SECRET || '',
        });

        // Initialize wallet provider with required configuration
        const walletConfig = {
          apiKeyId: process.env.CDP_API_KEY_ID || '',
          apiKeySecret: process.env.CDP_API_KEY_SECRET || '',
          walletSecret: process.env.CDP_WALLET_SECRET || '',
          network: {
            name: 'mainnet',
            chainId: 1,
            rpcUrl: process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
          }
        };
        
        this.walletProvider = await WalletProvider.configureWithWallet(walletConfig);

        // Initialize AgentKit using the static from method and extend it with executeAction
        const baseAgentKit = await AgentKitClass.from({
          walletProvider: this.walletProvider,
        });

        // Extend the agentKit with executeAction method
        this.agentKit = {
          ...baseAgentKit,
          executeAction: async <T = any>(
            action: string, 
            params: Record<string, any> = {}
          ): Promise<T> => {
            if (!(action in baseAgentKit)) {
              throw new Error(`Action '${action}' not found on AgentKit`);
            }
            // @ts-ignore - We've checked the action exists
            return baseAgentKit[action](params);
          }
        } as AgentKit;

        this.isInitialized = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize AgentKitService:', errorMessage);
        throw new Error(`Initialization failed: ${errorMessage}`);
      }
    })();

    return this.initializationPromise;
  }

  // Get the AgentKit instance
  getAgentKit(): AgentKit {
    if (!this.agentKit) {
      throw new Error('AgentKit not initialized. Call initialize() first.');
    }
    return this.agentKit;
  }

  // Get account information
  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    // This is a placeholder - replace with actual account info retrieval
    return {
      ownerAddress: '0x0000000000000000000000000000000000000000',
      smartAccountAddress: '0x0000000000000000000000000000000000000000',
      isInitialized: this.isInitialized,
    };
  }

  // Execute an action
  async executeAction<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.agentKit) {
      throw new Error('AgentKit not initialized');
    }

    try {
      return await this.agentKit.executeAction(action, params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error executing action ${action}:`, errorMessage);
      throw new Error(`Action failed: ${errorMessage}`);
    }
  }

  // Get network information
  async getNetworkInfo(): Promise<NetworkInfo> {
    const provider = this.getProvider();
    try {
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      const chainIdNum = Number(network.chainId);
      
      return {
        chainId,
        chainIdNumber: chainIdNum,
        name: network.name,
        isTestnet: chainId !== '1' // Compare as strings
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting network info:', errorMessage);
      throw new Error(`Failed to get network info: ${errorMessage}`);
    }
  }

  // Get current gas price
  async getGasPrice(): Promise<GasPriceInfo> {
    const provider = this.getProvider();
    try {
      const feeData = await provider.getFeeData();
      if (!feeData.gasPrice) {
        throw new Error('Gas price not available');
      }
      
      return {
        gasPrice: feeData.gasPrice.toString(),
        formatted: `${ethers.formatEther(feeData.gasPrice)} ETH`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting gas price:', errorMessage);
      throw new Error(`Failed to get gas price: ${errorMessage}`);
    }
  }

  // Get current block number
  async getBlockNumber(): Promise<number> {
    const provider = this.getProvider();
    try {
      return await provider.getBlockNumber();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error getting block number:', errorMessage);
      throw new Error(`Failed to get block number: ${errorMessage}`);
    }
  }

  // Private helper to get provider
  private getProvider(): ethers.JsonRpcProvider {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
      throw new Error('RPC_URL environment variable is not set');
    }
    return new ethers.JsonRpcProvider(rpcUrl);
  }
}

// Export a singleton instance
export const agentKitService = new AgentKitService();

// Export types for external use
export type { AgentKit, CdpV2EvmWalletProvider, NetworkInfo, AccountInfo, GasPriceInfo };