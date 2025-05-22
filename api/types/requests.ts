// Request type definitions

// User Operation Request interface
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

export interface CreateWalletRequest {
  type: string;
  name: string;
  network?: NetworkType;
}

export interface CreateSmartAccountRequest {
  ownerAddress: string;
  network?: NetworkType;
}

export interface OrchestrateRequest {
  task: string;
  apiKey: string;
}

export type NetworkType = string;
