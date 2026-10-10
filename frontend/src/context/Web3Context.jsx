import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID_AMOY, AMOY_NETWORK_PARAMS, SUPPORTED_CHAIN_IDS } from '../config';

const Web3Context = createContext(null);

/**
 * Resolves the true MetaMask provider even when multiple extensions
 * (e.g. Phantom, Coinbase, Brave Wallet) are installed.
 */
export const getEthereumProvider = () => {
  if (typeof window === 'undefined') return null;
  if (window.ethereum?.providers?.length) {
    const metamask = window.ethereum.providers.find(
      (p) => p.isMetaMask && !p.isPhantom && !p.isBraveWallet
    );
    return metamask || window.ethereum.providers.find((p) => p.isMetaMask) || window.ethereum.providers[0];
  }
  return window.ethereum || null;
};

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

  const errorTimeoutRef = useRef(null);

  const setTimedError = useCallback((msg) => {
    setError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (msg) {
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 7000);
    }
  }, []);

  const clearError = useCallback(() => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setError(null);
  }, []);

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

  // Initialize or restore existing wallet connection
  const initProvider = useCallback(async () => {
    const eth = getEthereumProvider();
    if (!eth) return;

    try {
      const browserProvider = new ethers.BrowserProvider(eth);
      setProvider(browserProvider);

      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      setIsAmoy(currentChainId === CHAIN_ID_AMOY);
      setIsSupported(SUPPORTED_CHAIN_IDS.includes(currentChainId));

      // Use eth_accounts (non-intrusive query for pre-authorized accounts)
      const accounts = await eth.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const activeAddress = accounts[0].toLowerCase();
        const activeSigner = await browserProvider.getSigner();
        setAccount(activeAddress);
        setSigner(activeSigner);
        updateBalance(browserProvider, activeAddress);
        localStorage.setItem('fc_wallet_connected', 'true');
      } else {
        setAccount(null);
        setSigner(null);
        setBalance('0.000');
      }
    } catch (err) {
      console.warn('Could not restore wallet connection:', err.message);
    }
  }, [updateBalance]);

  // Handle wallet events without destructive page reloads
  useEffect(() => {
    const eth = getEthereumProvider();
    if (!eth) return;

    initProvider();

    const handleAccountsChanged = async (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setBalance('0.000');
        localStorage.removeItem('fc_wallet_connected');
      } else {
        const newAddress = accounts[0].toLowerCase();
        setAccount(newAddress);
        const browserProvider = new ethers.BrowserProvider(eth);
        setProvider(browserProvider);
        try {
          const newSigner = await browserProvider.getSigner();
          setSigner(newSigner);
          updateBalance(browserProvider, newAddress);
        } catch (e) {
          console.warn('Error creating signer for updated account:', e.message);
        }
        localStorage.setItem('fc_wallet_connected', 'true');
      }
    };

    const handleChainChanged = async (newChainIdHex) => {
      const newChainId = parseInt(newChainIdHex, 16);
      setChainId(newChainId);
      setIsAmoy(newChainId === CHAIN_ID_AMOY);
      setIsSupported(SUPPORTED_CHAIN_IDS.includes(newChainId));

      const browserProvider = new ethers.BrowserProvider(eth);
      setProvider(browserProvider);

      if (account) {
        try {
          const newSigner = await browserProvider.getSigner();
          setSigner(newSigner);
          updateBalance(browserProvider, account);
        } catch (e) {
          console.warn('Error refreshing signer on chain change:', e.message);
        }
      }
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [account, initProvider, updateBalance]);

  const switchNetwork = async (targetChainIdHex = AMOY_NETWORK_PARAMS.chainId) => {
    const eth = getEthereumProvider();
    if (!eth) return;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });
      const browserProvider = new ethers.BrowserProvider(eth);
      const network = await browserProvider.getNetwork();
      const newChainId = Number(network.chainId);
      setProvider(browserProvider);
      setChainId(newChainId);
      setIsAmoy(newChainId === CHAIN_ID_AMOY);
      setIsSupported(SUPPORTED_CHAIN_IDS.includes(newChainId));
      if (account) {
        const newSigner = await browserProvider.getSigner();
        setSigner(newSigner);
        updateBalance(browserProvider, account);
      }
    } catch (switchError) {
      // 4902 or error message indicates chain has not been added to MetaMask yet
      const isChainNotAdded =
        switchError.code === 4902 ||
        switchError?.data?.originalError?.code === 4902 ||
        /unrecognized chain|not added/i.test(switchError.message || '');

      if (isChainNotAdded) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_NETWORK_PARAMS],
          });
          const browserProvider = new ethers.BrowserProvider(eth);
          const network = await browserProvider.getNetwork();
          const newChainId = Number(network.chainId);
          setProvider(browserProvider);
          setChainId(newChainId);
          setIsAmoy(newChainId === CHAIN_ID_AMOY);
          setIsSupported(SUPPORTED_CHAIN_IDS.includes(newChainId));
          if (account) {
            const newSigner = await browserProvider.getSigner();
            setSigner(newSigner);
            updateBalance(browserProvider, account);
          }
        } catch (addError) {
          setTimedError(`Failed to add network to MetaMask: ${addError.message}`);
        }
      } else if (switchError.code === 4001) {
        setTimedError('Network switch was cancelled in MetaMask.');
      } else {
        setTimedError(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  const connectWallet = async () => {
    const eth = getEthereumProvider();
    if (!eth) {
      setShowInstallModal(true);
      setTimedError('MetaMask extension is not detected. Please install MetaMask to continue.');
      return { success: false, reason: 'NO_METAMASK' };
    }

    setConnecting(true);
    clearError();

    try {
      // Direct request for account permissions
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in MetaMask');
      }

      const browserProvider = new ethers.BrowserProvider(eth);
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

      // If connected to an unsupported network, prompt switch to Polygon Amoy
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
      let msg = 'Failed to connect MetaMask';
      if (err.code === 4001) {
        msg = 'Connection request was rejected in MetaMask.';
      } else if (err.code === -32002) {
        msg = 'MetaMask has a pending connection prompt. Please click the MetaMask extension icon in your browser to approve it.';
      } else if (err.message) {
        msg = err.message;
      }
      setTimedError(msg);
      return { success: false, error: msg };
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setBalance('0.000');
    clearError();
    localStorage.removeItem('fc_wallet_connected');
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
        clearError,
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
