import contractAddressesJson from './contracts/contractAddresses.json';

// Centralized configuration module - Zero Hardcoding
const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_URL = (() => {
  if (rawApiUrl) {
    if (rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')) {
      return rawApiUrl.replace(/\/$/, '');
    }
    return `https://${rawApiUrl}`.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes(':5173')) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'http://localhost:5000';
})();
export const CHAIN_ID_AMOY = Number(import.meta.env.VITE_CHAIN_ID_AMOY || 80002);
export const AMOY_RPC_URL = import.meta.env.VITE_AMOY_RPC_URL || 'https://polygon-amoy-bor-rpc.publicnode.com';
export const BLOCK_EXPLORER_URL = import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://amoy.polygonscan.com';
export const PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';

export const SUPPORTED_CHAIN_IDS = [
  CHAIN_ID_AMOY, // 80002 (Polygon Amoy Testnet)
  31337,         // Hardhat Local Node
  1337,          // Local EVM
];

export const CONTRACT_ADDRESSES = {
  UserRegistry: import.meta.env.VITE_USER_REGISTRY_ADDRESS || contractAddressesJson.addresses?.UserRegistry || '',
  OrderRegistry: import.meta.env.VITE_ORDER_REGISTRY_ADDRESS || contractAddressesJson.addresses?.OrderRegistry || '',
  ComplaintRegistry: import.meta.env.VITE_COMPLAINT_REGISTRY_ADDRESS || contractAddressesJson.addresses?.ComplaintRegistry || '',
  DisputeResolution: import.meta.env.VITE_DISPUTE_RESOLUTION_ADDRESS || contractAddressesJson.addresses?.DisputeResolution || '',
  ReputationManager: import.meta.env.VITE_REPUTATION_MANAGER_ADDRESS || contractAddressesJson.addresses?.ReputationManager || '',
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
