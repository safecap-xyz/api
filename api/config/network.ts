// Network configuration
export interface NetworkConfig {
  rpcUrl: string;
  blockExplorerUrl: string;
  chainId: number;
}

export interface NetworkConfigs {
  [key: string]: NetworkConfig;
}

export const NETWORK_CONFIG: NetworkConfigs = {
  'base-mainnet': {
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    chainId: 8453
  },
  'base-sepolia': {
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    chainId: 84532
  },
  'base-goerli': {
    rpcUrl: 'https://goerli.base.org',
    blockExplorerUrl: 'https://goerli.basescan.org',
    chainId: 84531
  }
};
