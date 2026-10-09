import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Wallet, Lock, User, Phone, CheckCircle, AlertCircle, UtensilsCrossed } from 'lucide-react';

export const AuthPage = ({ initialRole = 'customer', onSuccess }) => {
  const { login, register } = useAuth();
  const { account, connectWallet, connecting } = useWeb3();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState(initialRole === 'juror' ? 'customer' : initialRole);
  const [walletAddress, setWalletAddress] = useState('');
  const [password, setPassword] = useState('FoodChain@2026!');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91-9876543210');
  const [restaurantName, setRestaurantName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialRole === 'juror' && !account) {
      handleQuickFill('juror');
    } else if (account) {
      setWalletAddress(account);
    }
  }, [account, initialRole]);

  // Demo accounts pre-set
  const DEMO_ACCOUNTS = {
    customer: { wallet: '0x1111111111111111111111111111111111111111', name: 'Rahul Sharma (Customer)' },
    restaurant: { wallet: '0x5555555555555555555555555555555555555501', name: 'Truffles Manager' },
    delivery_partner: { wallet: '0x2222222222222222222222222222222222222222', name: 'Vikram Singh (Rider)' },
    juror: { wallet: '0x7777777777777777777777777777777777777771', name: 'Juror Panelist #1' },
    admin: { wallet: '0x3333333333333333333333333333333333333333', name: 'System Administrator' },
  };

  const handleQuickFill = (presetRole) => {
    const acc = DEMO_ACCOUNTS[presetRole];
    if (acc) {
      setRole(presetRole === 'juror' ? 'customer' : presetRole);
      setWalletAddress(acc.wallet);
      setPassword('FoodChain@2026!');
      setName(acc.name);
      setIsRegister(false);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          role,
          walletAddress: walletAddress.trim(),
          password,
          name: name.trim() || 'FoodChain User',
          phone,
          restaurantName,
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
            Wallet-linked role access on Polygon Amoy
          </p>
        </div>

        {/* Demo Quick-fill Buttons */}
        <div className="bg-brand-grayLight border-2 border-brand-dark p-3 rounded-lg space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 block">
            Role Quick-Fill Demo Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(DEMO_ACCOUNTS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleQuickFill(k)}
                className="text-[11px] font-bold px-2 py-1 bg-white border border-black hover:bg-brand-yellow"
              >
                {k.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-100 border-2 border-black p-3 flex items-start gap-2 text-xs font-bold text-red-900">
            <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
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
                  className={`text-xs font-bold py-2 border-2 border-black transition-all ${
                    role === r.id
                      ? 'bg-brand-yellow shadow-neo-sm font-black'
                      : 'bg-white hover:bg-gray-100'
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
                  placeholder="Rahul Sharma"
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
                    placeholder="Truffles Gourmet Kitchen"
                    className="neo-input w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="neo-input w-full"
                />
              </div>
            </div>
          )}

          {/* Wallet Address */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-black uppercase tracking-wider">
                Ethereum Wallet Address (Polygon Amoy)
              </label>
              {!account && (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="text-[10px] font-black text-brand-red underline"
                >
                  {connecting ? 'Connecting...' : 'Fetch from MetaMask'}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              Account Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="neo-input w-full"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="neo-btn-primary w-full py-3 text-sm font-black uppercase tracking-wider"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle between login & register */}
        <div className="text-center pt-2 border-t-2 border-black text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="underline text-brand-dark hover:text-brand-red"
          >
            {isRegister
              ? 'Already registered? Sign in instead'
              : "Don't have an account yet? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};
