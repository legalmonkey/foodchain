import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID_AMOY, AMOY_NETWORK_PARAMS } from '../config';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isAmoy, setIsAmoy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const initProvider = useCallback(async () => {
    if (window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      try {
        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);
        setIsAmoy(currentChainId === CHAIN_ID_AMOY);

        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          const activeSigner = await browserProvider.getSigner();
          setAccount(accounts[0].address.toLowerCase());
          setSigner(activeSigner);
        }
      } catch (err) {
        console.warn('Could not read existing wallet accounts:', err.message);
      }
    }
  }, []);

  useEffect(() => {
    initProvider();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
        } else {
          setAccount(accounts[0].toLowerCase());
          if (provider) {
            const newSigner = await provider.getSigner();
            setSigner(newSigner);
          }
        }
      };

      const handleChainChanged = (newChainIdHex) => {
        const newChainId = parseInt(newChainIdHex, 16);
        setChainId(newChainId);
        setIsAmoy(newChainId === CHAIN_ID_AMOY);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [initProvider, provider]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask extension is not installed. Please install MetaMask to continue.');
      return null;
    }

    setConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send('eth_requestAccounts', []);
      const newSigner = await browserProvider.getSigner();
      const userAddress = (await newSigner.getAddress()).toLowerCase();
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setProvider(browserProvider);
      setSigner(newSigner);
      setAccount(userAddress);
      setChainId(currentChainId);
      setIsAmoy(currentChainId === CHAIN_ID_AMOY);

      if (currentChainId !== CHAIN_ID_AMOY) {
        await switchNetwork();
      }

      return userAddress;
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_NETWORK_PARAMS.chainId }],
      });
      setIsAmoy(true);
    } catch (switchError) {
      // Error 4902: Chain not added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_NETWORK_PARAMS],
          });
          setIsAmoy(true);
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
        connecting,
        error,
        connectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
