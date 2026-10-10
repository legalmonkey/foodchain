import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import {
  ShieldCheck,
  LogOut,
  Wallet,
  AlertTriangle,
  Award,
  UtensilsCrossed,
  Menu as MenuIcon,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { BLOCK_EXPLORER_URL } from '../config';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const {
    account,
    balance,
    isAmoy,
    isSupported,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    connecting,
    error,
    clearError,
    showInstallModal,
    setShowInstallModal,
  } = useWeb3();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'restaurants', label: 'Explore Food' },
    { id: 'transparency', label: 'Dispute Explorer' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'help', label: 'Help & Safety' },
    { id: 'juror', label: 'Community Jury' },
  ];

  const handleNavClick = (id) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
    setWalletDropdownOpen(false);
  };

  const getNetworkLabel = () => {
    if (chainId === 80002) return 'Polygon Amoy';
    if (chainId === 31337) return 'Hardhat Local';
    if (chainId === 1337) return 'Localhost';
    return chainId ? `Chain #${chainId}` : 'Connected';
  };

  return (
    <>
      <header className="bg-white border-b-2 border-brand-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <div
              onClick={() => handleNavClick('landing')}
              className="cursor-pointer flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-red text-white flex items-center justify-center border-2 border-brand-dark shadow-neo-sm group-hover:bg-brand-redHover transition-colors">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter uppercase text-brand-dark leading-none">
                  Food<span className="text-brand-red">Chain</span>
                </span>
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
                  Blockchain Grievance Redressal
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3.5 py-2 rounded-md text-xs font-black transition-colors ${
                    currentTab === link.id
                      ? 'text-brand-red bg-brand-redLight'
                      : 'text-gray-700 hover:text-brand-red hover:bg-brand-gray'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Actions: Wallet & User */}
          <div className="hidden sm:flex items-center gap-3">
            {/* User Reputation Badge if logged in */}
            {user && user.reputationScore !== undefined && (
              <div
                title="Verified On-Chain Reputation Score (0-100)"
                className="flex items-center gap-1.5 bg-brand-gray border border-brand-dark px-2.5 py-1 rounded text-xs font-bold text-brand-dark"
              >
                <Award className="w-3.5 h-3.5 text-brand-red" />
                <span>REP: {user.reputationScore}/100</span>
              </div>
            )}

            {/* Web3 Wallet Connect / Interactive Dropdown */}
            {account ? (
              <div className="relative">
                <button
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  className="flex items-center gap-2 bg-brand-gray border-2 border-brand-dark px-3 py-1.5 rounded-md text-xs font-black text-brand-dark hover:bg-brand-grayBorder shadow-neo-sm transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-brand-dark font-extrabold">{balance} POL</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-mono text-gray-800">{shortenAddress(account)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${walletDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {walletDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-brand-dark rounded-lg shadow-neo p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-[10px] font-black uppercase text-gray-500">Connected Wallet</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-green-100 text-green-900 border border-green-300 rounded">
                        {getNetworkLabel()}
                      </span>
                    </div>

                    {/* Address with copy */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Account Address</div>
                      <div className="flex items-center justify-between bg-brand-gray p-2 rounded border border-gray-300">
                        <span className="font-mono text-xs font-bold text-brand-dark truncate mr-2">
                          {account}
                        </span>
                        <button
                          onClick={() => copyToClipboard(account)}
                          className="p-1 hover:bg-white rounded transition-colors text-gray-700"
                          title="Copy address"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs font-bold text-gray-600">Balance:</span>
                      <span className="text-sm font-black text-brand-dark">{balance} POL</span>
                    </div>

                    {/* Network Switcher button if on unsupported network */}
                    {!isSupported && (
                      <button
                        onClick={switchNetwork}
                        className="w-full neo-btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Switch to Polygon Amoy</span>
                      </button>
                    )}

                    {/* External Explorer Link */}
                    <a
                      href={`${BLOCK_EXPLORER_URL}/address/${account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-bold text-brand-red hover:underline py-1"
                    >
                      <span className="inline-flex items-center gap-1">
                        View on PolygonScan <ExternalLink className="w-3 h-3" />
                      </span>
                    </a>

                    {/* Disconnect */}
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setWalletDropdownOpen(false);
                        }}
                        className="w-full border-2 border-brand-dark py-1.5 text-xs font-black text-gray-700 hover:bg-red-50 hover:text-brand-red rounded transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={connecting}
                className="neo-btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5 text-brand-red" />
                <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}

            {/* User Profile / Dashboard Access */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="neo-btn-primary text-xs py-1.5 px-3 uppercase tracking-wider"
                >
                  {user.role} Portal
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 bg-white hover:bg-brand-redLight text-brand-red border border-gray-300 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="neo-btn-primary text-xs py-2 px-4 uppercase tracking-wider"
              >
                Login / Sign Up
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center gap-2">
            {user ? (
              <button
                onClick={() => handleNavClick('dashboard')}
                className="neo-btn-primary text-[11px] py-1.5 px-2.5"
              >
                Portal
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('auth')}
                className="neo-btn-primary text-[11px] py-1.5 px-2.5"
              >
                Login
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-brand-dark rounded-md bg-brand-gray text-brand-dark"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t-2 border-brand-dark px-4 py-4 space-y-3 shadow-neo">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`p-2.5 rounded-lg text-xs font-black text-left border ${
                    currentTab === link.id
                      ? 'bg-brand-red text-white border-brand-dark'
                      : 'bg-brand-grayLight text-brand-dark border-gray-200'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
              {account ? (
                <div className="p-3 bg-brand-gray rounded-lg border border-brand-dark space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-500">Wallet:</span>
                    <span className="font-mono text-brand-dark">{shortenAddress(account)}</span>
                  </div>
                  <div className="flex items-center justify-between font-black">
                    <span className="text-gray-500">Balance:</span>
                    <span>{balance} POL</span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="w-full border border-black bg-white py-1 font-bold text-[11px] text-brand-red rounded"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="neo-btn-secondary text-xs py-2 w-full flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-brand-red" />
                  <span>Connect MetaMask Wallet</span>
                </button>
              )}

              {user && (
                <button
                  onClick={logout}
                  className="text-xs font-black text-brand-red py-2 hover:underline text-left"
                >
                  Sign Out ({user.name})
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Web3 Notification / Error Banner */}
      {error && (
        <div className="bg-amber-100 border-b-2 border-brand-dark px-4 py-2.5 text-xs font-black text-amber-950 flex items-center justify-between shadow-neo-sm animate-fadeIn">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-amber-200 rounded text-amber-900 shrink-0 ml-2"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Web3 MetaMask Required Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-3 border-brand-dark rounded-xl max-w-md w-full p-6 shadow-neo space-y-4">
            <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 border border-brand-dark flex items-center justify-center text-brand-red">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-tight text-brand-dark">
                  Web3 Wallet Required
                </h3>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              FoodChain connects directly to Polygon smart contracts for decentralized order escrow, immutable IPFS evidence, and juror staking rewards.
            </p>
            <p className="text-xs text-gray-600 font-medium">
              To connect your wallet, please install the MetaMask browser extension or open FoodChain inside a Web3-enabled mobile browser.
            </p>

            <div className="pt-2 flex gap-3">
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn-primary flex-1 py-2.5 text-xs font-black uppercase text-center flex items-center justify-center gap-1.5"
              >
                <span>Install MetaMask</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowInstallModal(false)}
                className="neo-btn-secondary px-4 py-2.5 text-xs font-black uppercase"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
