import { AgentKit, CdpV2EvmWalletProvider } from '@coinbase/agentkit';
import { CdpClient } from '@coinbase/cdp-sdk';

class AgentKitService {
  constructor() {
    this.cdpClient = new CdpClient({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET,
    });
    this.agentKit = null;
    this.ownerAccount = null;
    this.smartAccount = null;
  }

  async initialize() {
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
      return this;
    } catch (error) {
      console.error('Error initializing AgentKit:', error);
      throw error;
    }
  }

  async getAgentKit() {
    if (!this.agentKit) {
      await this.initialize();
    }
    return this.agentKit;
  }

  async getAccountInfo() {
    if (!this.ownerAccount || !this.smartAccount) {
      await this.initialize();
    }
    return {
      ownerAddress: this.ownerAccount?.address,
      smartAccountAddress: this.smartAccount?.address
    };
  }
}

export const agentKitService = new AgentKitService();