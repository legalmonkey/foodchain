import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Wallet, Lock, User, Phone, CheckCircle, AlertCircle, UtensilsCrossed, Check } from 'lucide-react';

export const AuthPage = ({ initialRole = 'customer', onSuccess }) => {
  const { login, register } = useAuth();
  const { account, connectWallet, connecting } = useWeb3();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState(initialRole === 'juror' ? 'customer' : initialRole);
  const [walletAddress, setWalletAddress] = useState(account || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setWalletAddress(account);
    }
  }, [account]);

  const handleConnectWalletClick = async () => {
    setError(null);
    const res = await connectWallet();
    if (res?.success && res.account) {
      setWalletAddress(res.account);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!walletAddress.trim()) {
      setError('A valid Ethereum / Polygon wallet address is required.');
      return;
    }

    if (!password) {
      setError('Please provide a secure password.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register({
          role,
          walletAddress: walletAddress.trim(),
          password,
          name: name.trim() || 'FoodChain User',
          phone: phone.trim(),
          restaurantName: role === 'restaurant' ? restaurantName.trim() : undefined,
        });
      } else {
        await login(walletAddress.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="neo-card p-6 sm:p-8 bg-white space-y-6">
        {/* Header */}
        <div className="border-b-2 border-brand-dark pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-red border-2 border-brand-dark rounded-xl p-2 mb-2 shadow-neo-sm text-white">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-brand-dark">
            {isRegister ? 'Create FoodChain Account' : 'Authenticate with Platform'}
          </h2>
          <p className="text-xs font-bold text-gray-600 mt-1">
            Web3 role-based access on Polygon Amoy
          </p>
        </div>

        {/* Web3 Wallet Quick Connect Status Card */}
        <div className="bg-brand-gray border-2 border-brand-dark p-3.5 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white border border-brand-dark flex items-center justify-center text-brand-red">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-500 block">Web3 Identity</span>
              {account ? (
                <span className="text-xs font-mono font-bold text-green-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  {account.slice(0, 8)}...{account.slice(-6)}
                </span>
              ) : (
                <span className="text-xs font-bold text-gray-600">Wallet not connected</span>
              )}
            </div>
          </div>

          {!account && (
            <button
              type="button"
              onClick={handleConnectWalletClick}
              disabled={connecting}
              className="neo-btn-primary text-xs py-1.5 px-3 uppercase"
            >
              {connecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-100 border-2 border-brand-dark p-3 flex items-start gap-2 text-xs font-bold text-red-900 rounded">
            <AlertCircle className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'customer', label: 'Customer' },
                { id: 'restaurant', label: 'Restaurant' },
                { id: 'delivery_partner', label: 'Delivery' },
                { id: 'admin', label: 'Admin' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`text-xs font-bold py-2 border-2 border-brand-dark rounded-md transition-all ${
                    role === r.id
                      ? 'bg-brand-red text-white shadow-neo-sm font-black'
                      : 'bg-white hover:bg-gray-100 text-brand-dark'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Registration extra fields */}
          {isRegister && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="neo-input w-full"
                />
              </div>

              {role === 'restaurant' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">
                    Restaurant Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g. Truffles Gourmet Kitchen"
                    className="neo-input w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="neo-input w-full"
                />
              </div>
            </div>
          )}

          {/* Wallet Address field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-black uppercase tracking-wider">
                Polygon / Ethereum Wallet Address
              </label>
              {account && (
                <button
                  type="button"
                  onClick={() => setWalletAddress(account)}
                  className="text-[10px] font-black text-brand-red hover:underline"
                >
                  Use Connected Wallet
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="neo-input w-full font-mono text-xs"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="neo-input w-full"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="neo-btn-primary w-full py-3 text-xs font-black uppercase tracking-wider shadow-neo mt-2"
          >
            {loading
              ? 'Processing...'
              : isRegister
              ? `Register as ${role.replace('_', ' ')}`
              : `Sign In to ${role.replace('_', ' ')} Account`}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-black text-brand-red hover:underline"
          >
            {isRegister
              ? 'Already registered? Sign in with your wallet'
              : 'New to FoodChain? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
};
