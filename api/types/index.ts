// Network configuration types
export interface NetworkConfig {
  rpcUrl: string;
  blockExplorerUrl: string;
  chainId: number;
}

export interface NetworkConfigs {
  [key: string]: NetworkConfig;
}

// Campaign types
export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  creator: string;
  backers: number;
  deadline: string;
}

// User Operation types
export interface UserOperationRequest {
  network?: string;
  smartAccountAddress?: string;
  calls?: any[];
  ownerAddress?: string;
}

export interface SampleUserOperationRequest {
  network?: string;
  type?: string;
  name?: string;
}

// Error response type
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

// Image generation types
export interface GenerateImageRequest {
  refImageUrl1: string;
  refImageUrl2: string;
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  ref_res?: number;
  num_steps?: number;
  guidance?: number;
  true_cfg?: number;
  cfg_start_step?: number;
  cfg_end_step?: number;
  neg_prompt?: string;
  neg_guidance?: number;
  first_step_guidance?: number;
  ref_task1?: string;
  ref_task2?: string;
}

export interface GenerateImageResponse {
  data: string; // Base64 encoded image or URL
  success: boolean;
  metadata?: Record<string, unknown>;
}

// Network types supported by CDP SDK
export type NetworkType = 'base-sepolia' | 'ethereum-sepolia';

// Wallet creation types
export interface CreateWalletRequest {
  type: string;
  name: string;
  network?: NetworkType;
}

// Smart Account types
export interface CreateSmartAccountRequest {
  ownerAddress: string;
  network?: NetworkType;
}

export interface CreateSmartAccountResponse {
  smartAccountAddress: string;
  ownerAddress: string;
  network: string;
}
