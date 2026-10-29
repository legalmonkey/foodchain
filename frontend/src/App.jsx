import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { HelpPage } from './pages/HelpPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { JurorDashboard } from './pages/JurorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ShieldCheck,
  Award,
  UtensilsCrossed,
  ExternalLink,
  HelpCircle,
  FileText,
  MapPin,
  ChevronRight,
  Clock
} from 'lucide-react';
import { BLOCK_EXPLORER_URL } from './config';

const MainContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing');
  // 'landing' | 'restaurants' | 'restaurant-detail' | 'transparency' | 'how-it-works' | 'help' | 'track' | 'juror' | 'dashboard' | 'auth'
  const [targetRole, setTargetRole] = useState('customer');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);

  // Scroll to top of window whenever the active view changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [view]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="p-6 bg-brand-red text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-neo flex items-center gap-3">
          <UtensilsCrossed className="w-5 h-5 animate-spin" />
          <span>Initializing FoodChain Consumer Ecosystem...</span>
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

  const handleExploreRestaurants = (search = '') => {
    setRestaurantSearchQuery(search);
    setView('restaurants');
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setView('restaurant-detail');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleOrderSuccess = (order) => {
    setActiveOrder(order);
    setView('track');
  };

  const renderCurrentView = () => {
    switch (view) {
      case 'landing':
        return (
          <LandingPage
            onExploreRestaurants={handleExploreRestaurants}
            onSelectRestaurant={handleSelectRestaurant}
            onNavigate={(newView) => setView(newView)}
            onGetStarted={handleGetStarted}
          />
        );

      case 'restaurants':
        return (
          <RestaurantsPage
            initialSearch={restaurantSearchQuery}
            onSelectRestaurant={handleSelectRestaurant}
          />
        );

      case 'restaurant-detail':
        return (
          <RestaurantDetailPage
            restaurant={selectedRestaurant}
            onBack={() => setView('restaurants')}
            onOrderSuccess={handleOrderSuccess}
          />
        );

      case 'transparency':
        return <TransparencyPage />;

      case 'how-it-works':
        return <HowItWorksPage onGetStarted={handleGetStarted} />;

      case 'help':
        return <HelpPage />;

      case 'track':
        return (
          <TrackOrderPage
            activeOrder={activeOrder}
            onBrowseMore={() => setView('restaurants')}
            onFileComplaint={(complaintData) => {
              console.log('Complaint filed:', complaintData);
            }}
          />
        );

      case 'juror':
        return (
          <JurorDashboard
            onNavigate={(newView, role) => {
              if (role) setTargetRole(role);
              setView(newView);
            }}
          />
        );

      case 'auth':
        return (
          <AuthPage
            initialRole={targetRole}
            onSuccess={() => {
              if (targetRole === 'juror') {
                setView('juror');
              } else {
                setView('dashboard');
              }
            }}
          />
        );

      case 'dashboard':
        if (!user) {
          return (
            <AuthPage
              initialRole={targetRole}
              onSuccess={() => {
                if (targetRole === 'juror') {
                  setView('juror');
                } else {
                  setView('dashboard');
                }
              }}
            />
          );
        }

        switch (user.role) {
          case 'customer':
            return <CustomerDashboard />;
          case 'restaurant':
            return <RestaurantDashboard />;
          case 'delivery_partner':
            return <DeliveryDashboard />;
          case 'juror':
            return (
              <JurorDashboard
                onNavigate={(newView, role) => {
                  if (role) setTargetRole(role);
                  setView(newView);
                }}
              />
            );
          case 'admin':
            return (
              <div className="space-y-6">
                <div className="bg-brand-gray border-2 border-brand-dark p-3.5 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-neo-sm">
                  <span className="text-xs font-black uppercase text-brand-dark">
                    Administrator System Switcher:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'admin', label: 'Admin Console' },
                      { id: 'customer', label: 'Customer View' },
                      { id: 'restaurant', label: 'Restaurant View' },
                      { id: 'delivery', label: 'Delivery View' },
                      { id: 'juror', label: 'Juror Panel' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setTargetRole(v.id)}
                        className={`text-xs font-black px-3 py-1.5 border-2 border-brand-dark rounded-md transition-all ${
                          targetRole === v.id
                            ? 'bg-brand-dark text-white shadow-neo-sm'
                            : 'bg-white text-brand-dark hover:bg-brand-grayLight'
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
                {targetRole === 'juror' && (
                  <JurorDashboard
                    onNavigate={(newView, role) => {
                      if (role) setTargetRole(role);
                      setView(newView);
                    }}
                  />
                )}
              </div>
            );
          default:
            return <CustomerDashboard />;
        }

      default:
        return (
          <LandingPage
            onExploreRestaurants={handleExploreRestaurants}
            onSelectRestaurant={handleSelectRestaurant}
            onNavigate={(newView) => setView(newView)}
            onGetStarted={handleGetStarted}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-dark font-['Public_Sans',sans-serif]">
      {/* Top Motto Ribbon Banner */}
      <div className="bg-brand-dark text-white text-[11px] sm:text-xs py-2 px-4 border-b-2 border-brand-dark font-bold tracking-wide flex items-center justify-center gap-2 text-center">
        <span className="px-2 py-0.5 rounded bg-brand-red text-white text-[10px] uppercase font-black tracking-widest shadow-neo-sm shrink-0">
          OUR MOTTO
        </span>
        <span className="font-extrabold text-white">
          "Never get cheated by a food app again."
        </span>
        <span className="hidden md:inline text-gray-400 font-medium">
          — 100% Smart Contract Escrow & Community Jury Redressal on Polygon Amoy
        </span>
      </div>

      {/* Top Zomato Red & White Navbar */}
      <Navbar currentTab={view} setCurrentTab={setView} />

      {/* Sub-Navigation Strip when Logged In */}
      {user && (
        <div className="bg-brand-gray border-b-2 border-brand-dark py-2.5 px-4 sm:px-8 flex justify-between items-center text-xs font-black">
          <div className="flex gap-4 sm:gap-6">
            <button
              onClick={() => setView('dashboard')}
              className={`hover:text-brand-red transition-colors ${
                view === 'dashboard' ? 'text-brand-red underline' : 'text-gray-700'
              }`}
            >
              My Role Dashboard
            </button>
            <button
              onClick={() => setView('restaurants')}
              className={`hover:text-brand-red transition-colors ${
                view === 'restaurants' ? 'text-brand-red underline' : 'text-gray-700'
              }`}
            >
              Order Food
            </button>
            <button
              onClick={() => setView('juror')}
              className={`hover:text-brand-red transition-colors flex items-center gap-1 ${
                view === 'juror' ? 'text-brand-red underline' : 'text-gray-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Community Jury & Disputes</span>
            </button>
            {activeOrder && (
              <button
                onClick={() => setView('track')}
                className={`hover:text-brand-red transition-colors flex items-center gap-1 ${
                  view === 'track' ? 'text-brand-red underline' : 'text-gray-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Track Active Order</span>
              </button>
            )}
          </div>

          <span className="text-gray-600 font-bold hidden sm:inline text-xs">
            Logged in: <strong className="text-brand-dark uppercase">{user.name}</strong> ({user.role})
          </span>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ErrorBoundary fallbackTitle="View Failed to Render">
          {renderCurrentView()}
        </ErrorBoundary>
      </main>

      {/* Production Consumer Footer (Zomato-styled White, Red, Black, Zero Emojis) */}
      <footer className="bg-brand-gray border-t-2 border-brand-dark pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-12 text-brand-dark">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center border border-brand-dark">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className="font-black text-xl tracking-tight uppercase">
                  Food<span className="text-brand-red">Chain</span>
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                <strong>Our Motto:</strong> Never get cheated by a food app again. Decentralized food delivery on Polygon Amoy with smart contract escrow, immutable IPFS evidence, and community jury redressal.
              </p>
              <div className="pt-2 text-[11px] font-bold text-gray-500">
                <span>Bangalore, Karnataka, India</span>
              </div>
            </div>

            {/* Consumer Links */}
            <div className="space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-brand-dark">For Foodies</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li>
                  <button onClick={() => setView('restaurants')} className="hover:text-brand-red transition-colors">
                    Explore Restaurants
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('restaurants')} className="hover:text-brand-red transition-colors">
                    Biryani, Burgers & Pizza
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('transparency')} className="hover:text-brand-red transition-colors">
                    Quality Guarantee & Refunds
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('help')} className="hover:text-brand-red transition-colors">
                    Filing a Complaint Guide
                  </button>
                </li>
              </ul>
            </div>

            {/* Platform & Governance Links */}
            <div className="space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-brand-dark">Decentralized Trust</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li>
                  <button onClick={() => setView('transparency')} className="hover:text-brand-red transition-colors">
                    Public Dispute Explorer
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('how-it-works')} className="hover:text-brand-red transition-colors">
                    Smart Contract Specifications
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('juror')} className="hover:text-brand-red transition-colors">
                    Join Community Juror Pool
                  </button>
                </li>
                <li>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/address/0x5FbDB2315678afecb367f032d93F642f64180aa3`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-red transition-colors flex items-center gap-1"
                  >
                    <span>Polygon Amoy Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Partner Access */}
            <div className="space-y-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-brand-dark">Ecosystem Portals</h4>
              <ul className="space-y-2 text-xs font-semibold text-gray-600">
                <li>
                  <button onClick={() => handleGetStarted('restaurant')} className="hover:text-brand-red transition-colors">
                    Restaurant Partner Login
                  </button>
                </li>
                <li>
                  <button onClick={() => handleGetStarted('delivery_partner')} className="hover:text-brand-red transition-colors">
                    Delivery Fleet Access
                  </button>
                </li>
                <li>
                  <button onClick={() => handleGetStarted('admin')} className="hover:text-brand-red transition-colors">
                    Administrator Console
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('help')} className="hover:text-brand-red transition-colors">
                    Support & Safety Center
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-500">
            <div>
              &copy; 2026 FoodChain Protocol. All rights reserved.
            </div>
            <div className="text-[11px] font-bold">
              Decentralized Food Delivery & Consumer Grievance Redressal
            </div>
          </div>
        </div>
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
