import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID_AMOY, AMOY_NETWORK_PARAMS, SUPPORTED_CHAIN_IDS } from '../config';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isAmoy, setIsAmoy] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [balance, setBalance] = useState('0.000');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Helper to fetch and update balance
  const updateBalance = useCallback(async (browserProvider, address) => {
    if (!browserProvider || !address) return;
    try {
      const rawBal = await browserProvider.getBalance(address);
      const formatted = parseFloat(ethers.formatEther(rawBal)).toFixed(3);
      setBalance(formatted);
    } catch (e) {
      console.warn('Could not read wallet balance:', e.message);
    }
  }, []);

  const initProvider = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      try {
        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);
        setIsAmoy(currentChainId === CHAIN_ID_AMOY);
        setIsSupported(SUPPORTED_CHAIN_IDS.includes(currentChainId));

        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          const activeSigner = await browserProvider.getSigner();
          const activeAddress = accounts[0].address.toLowerCase();
          setAccount(activeAddress);
          setSigner(activeSigner);
          updateBalance(browserProvider, activeAddress);
        }
      } catch (err) {
        console.warn('Could not read existing wallet accounts:', err.message);
      }
    }
  }, [updateBalance]);

  useEffect(() => {
    initProvider();

    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (!accounts || accounts.length === 0) {
          setAccount(null);
          setSigner(null);
          setBalance('0.000');
          localStorage.removeItem('fc_wallet_connected');
        } else {
          const newAddress = accounts[0].toLowerCase();
          setAccount(newAddress);
          if (provider) {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
            updateBalance(provider, newAddress);
          }
          localStorage.setItem('fc_wallet_connected', 'true');
        }
      };

      const handleChainChanged = (newChainIdHex) => {
        const newChainId = parseInt(newChainIdHex, 16);
        setChainId(newChainId);
        setIsAmoy(newChainId === CHAIN_ID_AMOY);
        setIsSupported(SUPPORTED_CHAIN_IDS.includes(newChainId));
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [initProvider, provider, updateBalance]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setShowInstallModal(true);
      setError('MetaMask extension is not installed. Please install MetaMask to continue.');
      return { success: false, reason: 'NO_METAMASK' };
    }

    setConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected');
      }

      const newSigner = await browserProvider.getSigner();
      const userAddress = (await newSigner.getAddress()).toLowerCase();
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setProvider(browserProvider);
      setSigner(newSigner);
      setAccount(userAddress);
      setChainId(currentChainId);
      setIsAmoy(currentChainId === CHAIN_ID_AMOY);
      setIsSupported(SUPPORTED_CHAIN_IDS.includes(currentChainId));

      await updateBalance(browserProvider, userAddress);
      localStorage.setItem('fc_wallet_connected', 'true');

      // If on an unsupported network (e.g. mainnet), request switch to Polygon Amoy
      if (!SUPPORTED_CHAIN_IDS.includes(currentChainId)) {
        try {
          await switchNetwork();
        } catch (switchErr) {
          console.warn('Network switch skipped or rejected:', switchErr.message);
        }
      }

      return { success: true, account: userAddress };
    } catch (err) {
      console.error('Wallet connection error:', err);
      const msg = err.code === 4001 ? 'Connection rejected in wallet' : (err.message || 'Failed to connect wallet');
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setBalance('0.000');
    localStorage.removeItem('fc_wallet_connected');
  };

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_NETWORK_PARAMS.chainId }],
      });
      setIsAmoy(true);
      setIsSupported(true);
    } catch (switchError) {
      // Error 4902: Chain not added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_NETWORK_PARAMS],
          });
          setIsAmoy(true);
          setIsSupported(true);
        } catch (addError) {
          setError(`Failed to add Polygon Amoy network: ${addError.message}`);
        }
      } else {
        setError(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        isAmoy,
        isSupported,
        balance,
        connecting,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        showInstallModal,
        setShowInstallModal,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
