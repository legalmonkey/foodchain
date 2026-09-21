// Centralized configuration module - Zero Hardcoding

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const CHAIN_ID_AMOY = Number(import.meta.env.VITE_CHAIN_ID_AMOY || 80002);
export const AMOY_RPC_URL = import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
export const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://amoy.polygonscan.com';
export const PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';

export const CONTRACT_ADDRESSES = {
  UserRegistry: import.meta.env.VITE_USER_REGISTRY_ADDRESS || '',
  OrderRegistry: import.meta.env.VITE_ORDER_REGISTRY_ADDRESS || '',
  ComplaintRegistry: import.meta.env.VITE_COMPLAINT_REGISTRY_ADDRESS || '',
  DisputeResolution: import.meta.env.VITE_DISPUTE_RESOLUTION_ADDRESS || '',
  ReputationManager: import.meta.env.VITE_REPUTATION_MANAGER_ADDRESS || '',
};

export const AMOY_NETWORK_PARAMS = {
  chainId: `0x${CHAIN_ID_AMOY.toString(16)}`,
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: [AMOY_RPC_URL],
  blockExplorerUrls: [BLOCK_EXPLORER_URL],
};
