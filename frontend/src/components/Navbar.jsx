import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { ShieldCheck, LogOut, Wallet, AlertTriangle, Award } from 'lucide-react';
import { BLOCK_EXPLORER_URL } from '../config';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { account, isAmoy, connectWallet, switchNetwork, connecting } = useWeb3();

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const roleColors = {
    customer: 'bg-blue-200 text-blue-900',
    restaurant: 'bg-orange-200 text-orange-900',
    delivery_partner: 'bg-green-200 text-green-900',
    admin: 'bg-purple-200 text-purple-900',
  };

  return (
    <header className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setCurrentTab('dashboard')}
            className="cursor-pointer flex items-center gap-2.5 bg-brand-yellow border-3 border-black px-3 py-1.5 shadow-neo active:translate-x-0.5 active:translate-y-0.5"
          >
            <span className="text-2xl">🍔</span>
            <span className="font-black text-xl tracking-tight uppercase">FoodChain</span>
          </div>

          {user && (
            <span className={`neo-badge ${roleColors[user.role] || 'bg-gray-100'}`}>
              {user.role.replace('_', ' ')}
            </span>
          )}

          {user && user.reputationScore !== undefined && (
            <div
              title="Verified On-Chain Reputation Score (0-100)"
              className="hidden md:flex items-center gap-1.5 bg-brand-muted border-2 border-black px-2.5 py-1 text-xs font-bold"
            >
              <Award className="w-4 h-4 text-brand-red" />
              <span>REP: {user.reputationScore}/100</span>
            </div>
          )}
        </div>

        {/* Navigation actions */}
        <div className="flex items-center gap-3">
          {/* Network Indicator */}
          {account && (
            <div>
              {isAmoy ? (
                <div className="hidden sm:flex items-center gap-1.5 bg-green-100 border-2 border-black px-2.5 py-1 text-xs font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black animate-pulse"></span>
                  <span>Polygon Amoy</span>
                </div>
              ) : (
                <button
                  onClick={switchNetwork}
                  className="flex items-center gap-1.5 bg-yellow-300 border-2 border-black px-2.5 py-1 text-xs font-black hover:bg-yellow-400"
                >
                  <AlertTriangle className="w-4 h-4 text-brand-red" />
                  <span>Switch to Amoy</span>
                </button>
              )}
            </div>
          )}

          {/* Web3 Wallet Connect */}
          {account ? (
            <a
              href={`${BLOCK_EXPLORER_URL}/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-brand-paper border-2 border-black px-3 py-1.5 text-xs font-bold hover:bg-brand-muted"
            >
              <Wallet className="w-4 h-4 text-brand-dark" />
              <span>{shortenAddress(account)}</span>
            </a>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="neo-btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Wallet className="w-4 h-4" />
              <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}

          {/* User Profile / Logout */}
          {user && (
            <button
              onClick={logout}
              title="Logout"
              className="border-2 border-black p-2 bg-white hover:bg-red-50 text-brand-red transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
