// AgentKit related types

export interface AgentKitAccountInfo {
  ownerAddress: string;
  smartAccountAddress: string;
}

export interface AgentKitExecuteRequest {
  action: string;
  params?: Record<string, unknown>;
}
