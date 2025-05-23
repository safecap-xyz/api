export interface OrchestrateRequest {
  task: string;
  apiKey: string;
  // Add any additional request parameters as needed
  [key: string]: unknown;
}

export interface MastraMessageRequest {
  agentId: string;
  message: string;
  // Add any additional message request parameters
  [key: string]: unknown;
}
