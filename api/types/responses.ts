// Response type definitions

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

export interface GenerateImageResponse {
  data: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateSmartAccountResponse {
  smartAccountAddress: string;
  ownerAddress: string;
  network: string;
}

export interface AgentKitExecuteResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}
