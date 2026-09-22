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
  Scale,
  FileText,
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import { BLOCK_EXPLORER_URL } from '../config';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { account, isAmoy, connectWallet, switchNetwork, connecting } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'restaurants', label: 'Explore Food' },
    { id: 'transparency', label: 'Dispute Explorer' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'help', label: 'Help & Safety' },
  ];

  const handleNavClick = (id) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b-2 border-brand-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo (Zomato-inspired Red & Black, Zero Emojis) */}
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

            <button
              onClick={() => handleNavClick('juror')}
              className={`px-3.5 py-2 rounded-md text-xs font-black transition-colors flex items-center gap-1.5 ${
                currentTab === 'juror'
                  ? 'text-brand-dark bg-brand-yellow/30'
                  : 'text-gray-700 hover:text-brand-dark hover:bg-brand-gray'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-brand-dark" />
              <span>Community Jury</span>
            </button>
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

          {/* Network Indicator */}
          {account && (
            <div>
              {isAmoy ? (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-700 text-green-800 px-2.5 py-1 rounded text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                  <span>Polygon Amoy</span>
                </div>
              ) : (
                <button
                  onClick={switchNetwork}
                  className="flex items-center gap-1.5 bg-brand-yellow border-2 border-brand-dark px-2.5 py-1 rounded text-xs font-black shadow-neo-sm hover:bg-yellow-400"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-brand-red" />
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
              className="flex items-center gap-1.5 bg-brand-gray border-2 border-brand-dark px-3 py-1.5 rounded-md text-xs font-black text-brand-dark hover:bg-brand-grayBorder shadow-neo-sm transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-brand-red" />
              <span>{shortenAddress(account)}</span>
            </a>
          ) : (
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="neo-btn-secondary text-xs py-2 px-3.5"
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
            <button
              onClick={() => handleNavClick('juror')}
              className={`p-2.5 rounded-lg text-xs font-black text-left border ${
                currentTab === 'juror'
                  ? 'bg-brand-red text-white border-brand-dark'
                  : 'bg-brand-grayLight text-brand-dark border-gray-200'
              }`}
            >
              Community Jury
            </button>
          </div>

          <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
            {account ? (
              <div className="flex items-center justify-between p-2 bg-brand-gray rounded text-xs font-bold">
                <span className="text-gray-500">Wallet:</span>
                <span className="font-mono text-brand-dark">{shortenAddress(account)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="neo-btn-secondary text-xs py-2 w-full"
              >
                Connect MetaMask Wallet
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
  );
};
