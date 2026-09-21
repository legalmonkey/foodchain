import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { JurorDashboard } from './pages/JurorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const MainContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard' | 'juror'
  const [targetRole, setTargetRole] = useState('customer');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper">
        <div className="neo-card p-6 bg-brand-yellow font-black text-lg animate-pulse">
          🍔 Loading FoodChain Ecosystem...
        </div>
      </div>
    );
  }

  const handleGetStarted = (role) => {
    setTargetRole(role);
    if (!user) {
      setView('auth');
    } else {
      setView(role === 'juror' ? 'juror' : 'dashboard');
    }
  };

  const renderDashboard = () => {
    if (view === 'juror') {
      return <JurorDashboard />;
    }

    switch (user?.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'restaurant':
        return <RestaurantDashboard />;
      case 'delivery_partner':
        return <DeliveryDashboard />;
      case 'admin':
        return (
          <div className="space-y-6">
            {/* Role Switcher Bar for Admin testing */}
            <div className="bg-brand-muted border-3 border-black p-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-purple-900">
                ⚡ Admin View Switcher:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'admin', label: 'Admin God-Mode' },
                  { id: 'customer', label: 'Customer View' },
                  { id: 'restaurant', label: 'Restaurant View' },
                  { id: 'delivery', label: 'Delivery View' },
                  { id: 'juror', label: 'Juror Panel' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setTargetRole(v.id)}
                    className={`text-xs font-bold px-2.5 py-1 border-2 border-black ${
                      targetRole === v.id
                        ? 'bg-purple-600 text-white font-black'
                        : 'bg-white hover:bg-yellow-200'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {targetRole === 'admin' && <AdminDashboard />}
            {targetRole === 'customer' && <CustomerDashboard />}
            {targetRole === 'restaurant' && <RestaurantDashboard />}
            {targetRole === 'delivery' && <DeliveryDashboard />}
            {targetRole === 'juror' && <JurorDashboard />}
          </div>
        );
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-paper text-brand-dark">
      <Navbar currentTab={view} setCurrentTab={setView} />

      {/* Role Navigation bar when logged in */}
      {user && (
        <div className="bg-white border-b-3 border-black py-2 px-4 sm:px-8 flex justify-between items-center text-xs font-black">
          <div className="flex gap-4">
            <button
              onClick={() => setView('dashboard')}
              className={`hover:text-brand-red ${view === 'dashboard' ? 'underline text-brand-red' : ''}`}
            >
              Main Dashboard
            </button>
            <button
              onClick={() => setView('juror')}
              className={`hover:text-brand-red flex items-center gap-1 ${view === 'juror' ? 'underline text-brand-red' : ''}`}
            >
              <span>⚖️ Juror Pool & Disputes</span>
            </button>
          </div>

          <span className="text-gray-500 font-normal hidden sm:inline">
            Logged in as: <strong className="font-bold text-black">{user.name}</strong>
          </span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!user ? (
          view === 'auth' ? (
            <AuthPage initialRole={targetRole} onSuccess={() => setView('dashboard')} />
          ) : (
            <LandingPage onGetStarted={handleGetStarted} />
          )
        ) : (
          renderDashboard()
        )}
      </main>

      {/* Neo-brutalist Footer */}
      <footer className="bg-white border-t-4 border-black py-6 px-4 text-center text-xs font-bold text-gray-700 space-y-1">
        <div>
          🍔 <strong className="font-black text-black">FoodChain</strong> — Decentralized Grievance Redressal System
        </div>
        <p className="text-[11px] text-gray-500">
          Smart Contracts on Polygon Amoy • Real IPFS Pinning via Pinata • Kaggle Zomato Dataset
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </Web3Provider>
  );
}
