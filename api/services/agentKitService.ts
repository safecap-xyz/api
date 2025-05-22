/**
 * AgentKit service for interacting with blockchain through Coinbase's AgentKit
 */
import { ethers } from 'ethers';
import { getEnv } from '../utils/env.js';

// Types
interface NetworkInfo {
  chainId: string;
  name: string;
  isTestnet: boolean;
  chainIdNumber: number;
}

interface AccountInfo {
  ownerAddress: string;
  smartAccountAddress: string;
  isInitialized: boolean;
}

interface GasPriceInfo {
  gasPrice: string;
  formatted: string;
}

// Dynamic imports for ESM compatibility
const importDependencies = async () => {
  const agentkit = await import('@coinbase/agentkit');
  const cdpsdk = await import('@coinbase/cdp-sdk');
  
  return {
    AgentKitClass: agentkit.AgentKit,
    WalletProvider: agentkit.CdpV2EvmWalletProvider,
    CdpClientClass: cdpsdk.CdpClient
  };
};

class AgentKitService {
  private cdpClient: any = null;
  private agentKit: any = null;
  private walletProvider: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Only initialize once
    if (this.isInitialized) {
      return;
    }

    // Return existing initialization promise if it exists
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  /**
   * Private initialization method
   */
  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing AgentKit service...');
      
      // Get required environment variables
      const cdpApiKeyId = getEnv('CDP_API_KEY_ID', '', true);
      const cdpApiKeySecret = getEnv('CDP_API_KEY_SECRET', '', true);
      const cdpWalletSecret = getEnv('CDP_WALLET_SECRET', '', true);
      
      // Dynamically import dependencies
      const { AgentKitClass, WalletProvider, CdpClientClass } = await importDependencies();
      
      // Initialize CDP client
      this.cdpClient = new CdpClientClass({
        apiKeyId: cdpApiKeyId,
        apiKeySecret: cdpApiKeySecret
      });
      
      // Initialize wallet provider
      this.walletProvider = new WalletProvider({
        cdpClient: this.cdpClient,
        walletSecret: cdpWalletSecret
      });
      
      // Initialize AgentKit
      this.agentKit = new AgentKitClass({
        walletProvider: this.walletProvider,
        network: 'sepolia'
      });
      
      this.isInitialized = true;
      console.log('AgentKit service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AgentKit service:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Get the AgentKit instance
   */
  getAgentKit(): any {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    return this.agentKit;
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    
    const ownerAddress = await this.walletProvider.getAddress();
    const smartAccountAddress = await this.agentKit.getSmartAccountAddress();
    
    return {
      ownerAddress,
      smartAccountAddress,
      isInitialized: true
    };
  }

  /**
   * Execute an action
   */
  async executeAction<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    
    return await this.agentKit.executeAction(action, params);
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    
    const provider = this.getProvider();
    const { chainId } = await provider.getNetwork();
    
    return {
      chainId: chainId.toString(),
      name: 'sepolia',
      isTestnet: true,
      chainIdNumber: Number(chainId)
    };
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<GasPriceInfo> {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    
    const provider = this.getProvider();
    const gasPrice = await provider.getGasPrice();
    
    return {
      gasPrice: gasPrice.toString(),
      formatted: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
    };
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    
    const provider = this.getProvider();
    return await provider.getBlockNumber();
  }

  /**
   * Get balance of an address in ETH
   */
  async getBalance(address: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('AgentKit service is not initialized');
    }
    
    const provider = this.getProvider();
    const balance = await provider.getBalance(address);
    
    return ethers.formatEther(balance);
  }

  /**
   * Private helper to get provider
   */
  private getProvider(): ethers.JsonRpcProvider {
    if (!this.agentKit) {
      throw new Error('AgentKit is not initialized');
    }
    
    return this.agentKit.provider;
  }
}

// Export a singleton instance
export const agentKitService = new AgentKitService();
