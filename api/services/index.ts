import { CdpClient } from '@coinbase/cdp-sdk';
import { Client } from "@gradio/client";
import { ethers } from 'ethers';
import type {
  Campaign,
  CreateSmartAccountRequest,
  CreateSmartAccountResponse,
  CreateWalletRequest,
  GenerateImageRequest,
  GenerateImageResponse,
  NetworkType
} from '../types/index.js';

// CDP Client initialization service
export class CDPService {
  private cdpClient: CdpClient | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET || !process.env.CDP_WALLET_SECRET) {
        console.warn('Missing one or more required CDP environment variables. CDP functionality will be disabled.');
        console.warn('Please set CDP_API_KEY_ID, CDP_API_KEY_SECRET, and CDP_WALLET_SECRET in your .env file');
      } else {
        this.cdpClient = new CdpClient({
          apiKeyId: process.env.CDP_API_KEY_ID,
          apiKeySecret: process.env.CDP_API_KEY_SECRET,
          walletSecret: process.env.CDP_WALLET_SECRET,
        });
        console.log('CDP client initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize CDP client:', error);
      console.warn('Continuing without CDP functionality');
    }
  }

  getClient(): CdpClient | null {
    return this.cdpClient;
  }

  isAvailable(): boolean {
    return this.cdpClient !== null;
  }

  async createSmartAccount(request: CreateSmartAccountRequest): Promise<CreateSmartAccountResponse> {
    if (!this.cdpClient) {
      throw new Error('CDP client is not initialized');
    }

    const { ownerAddress, network = 'base-sepolia' } = request;

    // Validate and format the address
    if (!ethers.isAddress(ownerAddress)) {
      throw new Error('The provided owner address is not a valid Ethereum address');
    }

    const formattedAddress = ethers.getAddress(ownerAddress);
    const typedAddress = formattedAddress as `0x${string}`;

    console.log(`Creating smart account with owner: ${formattedAddress} on network: ${network}`);

    try {
      // Try to get existing owner account
      let ownerAccount;

      try {
        ownerAccount = await this.cdpClient.evm.getAccount({ address: typedAddress });
      } catch (error) {
        // If owner account doesn't exist, create a new one
        const timestamp = Date.now().toString();
        const validName = `owner${timestamp.substring(timestamp.length - 8)}`;

        ownerAccount = await this.cdpClient.evm.getOrCreateAccount({
          name: validName
        });
      }

      // Create the smart account using the EVM client
      const result = await this.cdpClient.evm.createSmartAccount({
        owner: ownerAccount,
      });

      return {
        smartAccountAddress: result.address,
        ownerAddress: formattedAddress,
        network
      };

    } catch (error: any) {
      console.error('Error during smart account creation:', error);
      throw error;
    }
  }

  async createWallet(request: CreateWalletRequest): Promise<{ account: any; transactionHash: string }> {
    if (!this.cdpClient) {
      throw new Error('CDP client is not initialized');
    }

    const { type, name, network = 'base-sepolia' } = request;

    console.log(`Creating ${type} account with name: ${name}`);

    let newAccount;
    let transactionHash = '';

    if (type === 'EVM') {
      // Create EVM account
      newAccount = await this.cdpClient.evm.getOrCreateAccount({ name });
      console.log('EVM account created:', newAccount.address);

      // Request faucet funds
      console.log('Requesting faucet funds for network:', network);
      const faucetResult = await this.cdpClient.evm.requestFaucet({
        address: newAccount.address,
        network,
        token: "eth",
      });
      transactionHash = faucetResult.transactionHash;
      console.log('Faucet transaction hash:', transactionHash);
    } else if (type === 'SOLANA') {
      // Create Solana account
      newAccount = await this.cdpClient.solana.getOrCreateAccount({ name });
      console.log('Solana account created:', newAccount.address);

      // Request Solana faucet funds
      console.log('Requesting Solana faucet funds');
      const faucetResult = await this.cdpClient.solana.requestFaucet({
        address: newAccount.address,
        token: "sol"
      });
      transactionHash = faucetResult.signature || '';
      console.log('Solana faucet transaction signature:', transactionHash);
    } else {
      throw new Error(`Unsupported account type: ${type}`);
    }

    return {
      account: newAccount,
      transactionHash
    };
  }
}

// Image generation service
export class ImageGenerationService {
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const {
      refImageUrl1,
      refImageUrl2,
      prompt,
      seed = 7698454872441022867,
      width = 1024,
      height = 1024,
      ref_res = 512,
      num_steps = 12,
      guidance = 3.5,
      true_cfg = 1,
      cfg_start_step = 0,
      cfg_end_step = 0,
      neg_prompt = '',
      neg_guidance = 1,
      first_step_guidance = 0,
      ref_task1 = 'id',
      ref_task2 = 'ip',
    } = request;

    // Validate required fields
    if (!refImageUrl1 || !refImageUrl2 || !prompt) {
      throw new Error('Missing required fields: refImageUrl1, refImageUrl2, and prompt are required');
    }

    console.log('Fetching reference images...');
    const [refImage1Blob, refImage2Blob] = await Promise.all([
      (await fetch(refImageUrl1)).blob(),
      (await fetch(refImageUrl2)).blob(),
    ]);

    console.log('Connecting to Gradio client...');
    const client = await Client.connect("ByteDance/DreamO");

    console.log('Generating image...');
    const result = await client.predict("/generate_image", {
      ref_image1: refImageUrl1,
      ref_image2: refImageUrl2,
      ref_task1,
      ref_task2,
      prompt,
      seed,
      width,
      height,
      ref_res,
      num_steps,
      guidance,
      true_cfg,
      cfg_start_step,
      cfg_end_step,
      neg_prompt,
      neg_guidance,
      first_step_guidance,
    });

    return {
      data: result.data,
      success: true,
      metadata: {
        model: "ByteDance/DreamO",
        timestamp: new Date().toISOString(),
        parameters: {
          seed,
          width,
          height,
          steps: num_steps,
          guidance_scale: guidance,
        },
      },
    };
  }
}

// Campaign service (in-memory database simulation)
export class CampaignService {
  private campaigns: Campaign[] = [];

  getAllCampaigns(): Campaign[] {
    return this.campaigns;
  }

  getCampaignById(id: string): Campaign | undefined {
    return this.campaigns.find(campaign => campaign.id === id);
  }

  createCampaign(campaignData: Omit<Campaign, 'id' | 'backers' | 'raised'>): Campaign {
    const newCampaign: Campaign = {
      ...campaignData,
      id: Date.now().toString(),
      backers: 0,
      raised: 0
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  donateToCampaign(id: string, amount: number): Campaign | null {
    const campaign = this.getCampaignById(id);
    if (!campaign) {
      return null;
    }

    campaign.raised += amount;
    campaign.backers += 1;
    return campaign;
  }
}

// Singleton instances
export const cdpService = new CDPService();
export const imageGenerationService = new ImageGenerationService();
export const campaignService = new CampaignService();
