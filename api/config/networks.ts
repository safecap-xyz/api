/**
 * Network configurations
 */
import { NetworkConfigs } from '../types/agentkit.js';

/**
 * Supported network configurations
 */
export const networks: NetworkConfigs = {
  ethereum: {
    rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
    blockExplorerUrl: 'https://etherscan.io',
    chainId: 1
  },
  sepolia: {
    rpcUrl: 'https://sepolia.infura.io/v3/your-api-key',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    chainId: 11155111
  },
  // Add more networks as needed
};

/**
 * Get network configuration by name
 * @param networkName Name of the network
 */
export function getNetworkConfig(networkName: string) {
  const network = networks[networkName.toLowerCase()];
  
  if (!network) {
    throw new Error(`Network ${networkName} is not supported`);
  }
  
  return network;
}

/**
 * Get default network name
 */
export function getDefaultNetwork(): string {
  return process.env.DEFAULT_NETWORK || 'sepolia';
}
