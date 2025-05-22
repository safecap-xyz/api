/**
 * AgentKit related type definitions
 */

export interface NetworkConfig {
  rpcUrl: string;
  blockExplorerUrl: string;
  chainId: number;
}

export interface NetworkConfigs {
  [key: string]: NetworkConfig;
}

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

export interface AgentKitAccountInfo {
  ownerAddress: string;
  smartAccountAddress: string;
}

export interface AgentKitExecuteRequest {
  action: string;
  params?: Record<string, unknown>;
}

export interface AgentKitExecuteResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface CreateSmartAccountRequest {
  ownerAddress: string;
  network?: string; // Using string instead of NetworkType for simplicity
}

export interface CreateSmartAccountResponse {
  smartAccountAddress: string;
  ownerAddress: string;
  network: string;
}

// We use string as a type here, but in a real implementation this would be a specific set of network types
export type NetworkType = string;
