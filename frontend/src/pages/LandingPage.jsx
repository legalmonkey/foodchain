import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  Scale,
  Award,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Utensils,
  Store,
  Truck,
  Sparkles,
  Smartphone,
  Check,
  Lock,
  Flame,
  Zap,
  Bike,
  Activity,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';
import { KAGGLE_RESTAURANTS } from '../data/zomatoRestaurants';

export const LandingPage = ({ onExploreRestaurants, onSelectRestaurant, onNavigate, onGetStarted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Bangalore, Central');

  const popularCuisines = [
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop', count: '14 places' },
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop', count: '9 places' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop', count: '11 places' },
    { name: 'South Indian', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop', count: '8 places' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=400&auto=format&fit=crop', count: '12 places' },
    { name: 'Desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop', count: '6 places' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onExploreRestaurants) {
      onExploreRestaurants(searchQuery);
    }
  };

  const topBrands = KAGGLE_RESTAURANTS.slice(0, 6);

  return (
    <div className="space-y-16 py-4">
      {/* 1. HERO SECTION: Dynamic Split View with Visual Food Centerpiece */}
      <section className="relative bg-white border-2 border-brand-dark rounded-3xl overflow-hidden shadow-neo-lg">
        {/* Subtle decorative top accent bar */}
        <div className="h-2.5 bg-brand-red w-full"></div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column (Content & Search) - 7 cols */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 bg-brand-redLight border border-brand-red text-brand-red px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide">
                <ShieldCheck className="w-4 h-4 text-brand-red shrink-0" />
                <span>100% QUALITY GUARANTEED • SMART CONTRACT ESCROW & JURY REDRESSAL</span>
              </div>

              {/* Bold Title */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-dark tracking-tight uppercase leading-[1.05]">
                  Delicious Food.<br />
                  <span className="text-brand-red">Zero Disappointment.</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-700 font-medium max-w-xl leading-relaxed">
                  Order from Bangalore's most iconic kitchens. Every payment is anchored in a transparent smart contract escrow. If your meal arrives cold, damaged, or wrong, our decentralized community jury resolves complaints with instant refunds.
                </p>
              </div>

              {/* Upgraded High-Contrast Search Bar Container */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white border-2 border-brand-dark p-2 rounded-2xl shadow-neo flex flex-col sm:flex-row items-center gap-2"
              >
                {/* Location Selector */}
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-black text-brand-dark border-b sm:border-b-0 sm:border-r-2 border-brand-dark w-full sm:w-auto shrink-0 bg-brand-grayLight rounded-xl">
                  <MapPin className="w-4 h-4 text-brand-red shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer font-bold pr-2"
                  >
                    <option>Bangalore, Central</option>
                    <option>Koramangala, 5th Block</option>
                    <option>Indiranagar, 100ft Rd</option>
                    <option>Malleshwaram, Margosa</option>
                    <option>Whitefield, Phoenix</option>
                  </select>
                </div>

                {/* Input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for Truffles, Meghana Biryani, Pizza..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-semibold text-brand-dark placeholder-gray-400 focus:outline-none bg-transparent"
                  />
                </div>

                {/* Search Action Button */}
                <button
                  type="submit"
                  className="neo-btn-primary py-2.5 px-6 text-xs uppercase tracking-wider w-full sm:w-auto shrink-0 rounded-xl"
                >
                  <span>Search Food</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Filter Cuisine Pills with Food Icons */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                <span className="text-gray-500 font-semibold">Popular:</span>
                {[
                  { label: 'Meghana Biryani', query: 'Meghana' },
                  { label: 'Truffles Burgers', query: 'Truffles' },
                  { label: 'Brik Oven Pizza', query: 'Brik' },
                  { label: 'VB Masala Dosa', query: 'Vidyarthi' },
                  { label: 'Corner House DBC', query: 'Corner' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onExploreRestaurants && onExploreRestaurants(item.query)}
                    className="px-3 py-1.5 bg-brand-gray border border-gray-300 rounded-full hover:border-brand-dark hover:bg-white text-gray-800 transition-all text-xs font-bold hover:shadow-neo-sm"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Micro Trust Proof Bar */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 text-brand-dark">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-brand-red border border-red-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs">Smart Escrow</div>
                    <div className="text-[10px] text-gray-500 font-medium">Funds locked till delivery</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-700 border border-green-200">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs">5-Juror Jury</div>
                    <div className="text-[10px] text-gray-500 font-medium">Fair evidence arbitration</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-800 border border-yellow-200">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs">Instant Refund</div>
                    <div className="text-[10px] text-gray-500 font-medium">Zero customer support loops</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: High-Impact Visual Food Centerpiece - 5 cols */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Background circular decorative glow */}
              <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-red-100/60 blur-3xl -z-0"></div>

              {/* Main Featured Showcase Card */}
              <div className="relative z-10 w-full max-w-sm bg-white border-2 border-brand-dark rounded-2xl overflow-hidden shadow-neo-lg hover:-translate-y-1 transition-all duration-200">
                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&auto=format&fit=crop"
                    alt="Meghana Special Biryani"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay tags */}
                  <div className="absolute top-3 left-3 bg-brand-red text-white text-[11px] font-black px-2.5 py-1 border border-black rounded shadow-neo-sm flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>#1 Bestseller in Bangalore</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm border border-black px-2.5 py-1 rounded text-xs font-black flex items-center gap-1 shadow-neo-sm">
                    <Clock className="w-3.5 h-3.5 text-brand-red" />
                    <span>25-30 mins</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-base text-brand-dark">Meghana Special Biryani</h3>
                      <p className="text-xs text-gray-500 font-medium">Meghana Foods • Koramangala</p>
                    </div>
                    <div className="bg-green-700 text-white font-black text-xs px-2 py-0.5 rounded flex items-center gap-1 border border-black">
                      <span>4.8</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">On-Chain Price</span>
                      <span className="text-base font-black text-brand-dark">₹340</span>
                    </div>
                    <button
                      onClick={() => onSelectRestaurant ? onSelectRestaurant(topBrands[1] || topBrands[0]) : onExploreRestaurants('Meghana')}
                      className="neo-btn-primary py-1.5 px-4 text-xs font-black uppercase tracking-wider"
                    >
                      <span>Order Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1: Smart Escrow Active (Top Right) */}
              <div className="absolute -top-4 -right-2 sm:-right-4 z-20 bg-brand-dark text-white border-2 border-brand-dark px-3 py-2 rounded-xl shadow-neo flex items-center gap-2 animate-bounce duration-1000">
                <div className="w-6 h-6 rounded-full bg-brand-red flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-300">Polygon Amoy</div>
                  <div className="text-xs font-black">Escrow Locked</div>
                </div>
              </div>

              {/* Floating Badge 2: Live Grievance Redressed (Bottom Left) */}
              <div className="absolute -bottom-5 -left-2 sm:-left-6 z-20 bg-white border-2 border-brand-dark px-3 py-2 rounded-xl shadow-neo flex items-center gap-2.5 max-w-[240px]">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wide text-green-700">Case #42 Resolved</div>
                  <div className="text-xs font-black text-brand-dark line-clamp-1">Refunded in 94s by Jury</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME DECENTRALIZED PROTOCOL TICKER */}
      <section className="bg-brand-dark border-2 border-brand-dark rounded-2xl py-3 px-4 shadow-neo text-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-gray-300 uppercase tracking-wider text-[11px]">Live Protocol Activity:</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
              <span>Order #1042 Escrow Anchored</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              <span>Truffles Koramangala: 96/100 Trust Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>Case #39 Finalized: 5 Jurors Rewarded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-green-400" />
              <span>Average Delivery: 26 Mins</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE ZOMATO-STYLE THREE HERO BANNERS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Banner 1: Order Food Online */}
        <div
          onClick={() => onExploreRestaurants && onExploreRestaurants('')}
          className="relative bg-white border-2 border-brand-dark rounded-2xl overflow-hidden shadow-neo cursor-pointer group hover:-translate-y-1 transition-all duration-200"
        >
          <div className="h-44 w-full overflow-hidden bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop"
              alt="Order Food Online"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
              <Utensils className="w-3 h-3" />
              <span>Curated Menus</span>
            </div>
            <h3 className="text-xl font-black uppercase leading-tight">Order Food Online</h3>
            <p className="text-xs text-gray-200 font-medium">10+ iconic Bangalore brands from the Kaggle dataset</p>
          </div>
        </div>

        {/* Banner 2: Dispute Explorer */}
        <div
          onClick={() => onNavigate && onNavigate('transparency')}
          className="relative bg-white border-2 border-brand-dark rounded-2xl overflow-hidden shadow-neo cursor-pointer group hover:-translate-y-1 transition-all duration-200"
        >
          <div className="h-44 w-full overflow-hidden bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop"
              alt="On-Chain Grievance Redressal"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-yellow-300 flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>Public Accountability</span>
            </div>
            <h3 className="text-xl font-black uppercase leading-tight">Dispute Redressal</h3>
            <p className="text-xs text-gray-200 font-medium">Immutable IPFS evidence & 5-juror arbitration</p>
          </div>
        </div>

        {/* Banner 3: Juror Pool */}
        <div
          onClick={() => onGetStarted('juror')}
          className="relative bg-white border-2 border-brand-dark rounded-2xl overflow-hidden shadow-neo cursor-pointer group hover:-translate-y-1 transition-all duration-200"
        >
          <div className="h-44 w-full overflow-hidden bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop"
              alt="Community Juror Staking"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-green-300 flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Web3 Staking Yield</span>
            </div>
            <h3 className="text-xl font-black uppercase leading-tight">Community Jury</h3>
            <p className="text-xs text-gray-200 font-medium">Stake test POL, judge photo proof & earn rewards</p>
          </div>
        </div>
      </section>

      {/* 4. VISUAL FOOD CATEGORIES SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-brand-dark tracking-tight">
              Inspirations for your first order
            </h2>
            <p className="text-xs text-gray-600 font-medium">Explore hand-picked cuisines loved across Bangalore</p>
          </div>
          <button
            onClick={() => onExploreRestaurants && onExploreRestaurants('')}
            className="text-xs font-black text-brand-red flex items-center gap-1 hover:underline"
          >
            <span>See All Restaurants</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCuisines.map((c) => (
            <div
              key={c.name}
              onClick={() => onExploreRestaurants && onExploreRestaurants(c.name)}
              className="bg-white border-2 border-brand-dark rounded-2xl p-4 shadow-neo hover:-translate-y-1 transition-all cursor-pointer text-center space-y-3 group"
            >
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-brand-dark bg-gray-100 shadow-neo-sm">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="font-black text-sm text-brand-dark group-hover:text-brand-red transition-colors">
                  {c.name}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold">{c.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TOP BANGALORE BRANDS (Kaggle Zomato Dataset) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-brand-dark tracking-tight">
              Top Brands in Bangalore
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              Curated iconic chains from the Kaggle Bangalore Zomato dataset with on-chain verified trust
            </p>
          </div>
          <button
            onClick={() => onExploreRestaurants && onExploreRestaurants('')}
            className="text-xs font-black text-brand-red flex items-center gap-1 hover:underline"
          >
            <span>View All ({KAGGLE_RESTAURANTS.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topBrands.map((res) => (
            <div
              key={res._id}
              onClick={() => onSelectRestaurant ? onSelectRestaurant(res) : (onExploreRestaurants && onExploreRestaurants(res.name))}
              className="bg-white border-2 border-brand-dark rounded-2xl overflow-hidden shadow-neo hover:-translate-y-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-52 w-full overflow-hidden border-b-2 border-brand-dark bg-gray-100">
                  <img
                    src={res.imageUrl}
                    alt={res.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {res.offer && (
                    <div className="absolute bottom-3 left-3 bg-brand-red text-white text-[11px] font-black px-2.5 py-1 border border-black rounded shadow-neo-sm">
                      {res.offer}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white border border-black text-brand-dark text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-neo-sm">
                    <Clock className="w-3.5 h-3.5 text-brand-red" />
                    <span>{res.deliveryTime}</span>
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-black text-brand-dark group-hover:text-brand-red transition-colors">
                        {res.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-1">{res.tagline}</p>
                    </div>

                    <div className="bg-green-700 text-white font-black text-xs px-2.5 py-1 rounded flex items-center gap-1 shrink-0 border border-black">
                      <span>{res.rating}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 font-semibold line-clamp-1">
                    {res.cuisine.join(', ')}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100 font-medium">
                    <span>{res.address}</span>
                    <span className="font-bold text-brand-dark">₹{res.costForTwo} for two</span>
                  </div>
                </div>
              </div>

              {/* Trust Score & Action */}
              <div className="px-5 py-3.5 bg-brand-grayLight border-t-2 border-brand-dark flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-red" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Reputation</span>
                    <span className="font-black text-brand-dark">{res.reputationScore}/100</span>
                  </div>
                </div>
                <span className="font-black text-xs text-brand-red flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>View Menu</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HOW FOODCHAIN PROTECTS YOUR MEAL (Visual 4-Step Diagram) */}
      <section className="bg-white border-2 border-brand-dark rounded-3xl p-8 sm:p-12 shadow-neo-lg space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-gray border border-brand-dark text-brand-dark px-3 py-1 rounded-full text-xs font-black">
            <Lock className="w-3.5 h-3.5 text-brand-red" />
            <span>HOW FOODCHAIN WORKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-brand-dark tracking-tight">
            Decentralized Dispute Redressal in 4 Steps
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            We removed unilateral corporate decision-making. No chat bots telling you to accept cold soup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-2xl p-5 shadow-neo space-y-3">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white font-black text-sm flex items-center justify-center border border-black">
              1
            </div>
            <h4 className="font-black text-sm uppercase text-brand-dark">Smart Order Escrow</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              When you place an order, payment is held safely in the `OrderRegistry` smart contract on Polygon Amoy.
            </p>
          </div>

          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-2xl p-5 shadow-neo space-y-3">
            <div className="w-8 h-8 rounded-full bg-brand-dark text-white font-black text-sm flex items-center justify-center border border-black">
              2
            </div>
            <h4 className="font-black text-sm uppercase text-brand-dark">Live Socket Tracking</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Kitchen prep, rider pickup, and door delivery progress in real time via live WebSocket state broadcasts.
            </p>
          </div>

          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-2xl p-5 shadow-neo space-y-3">
            <div className="w-8 h-8 rounded-full bg-brand-red text-white font-black text-sm flex items-center justify-center border border-black">
              3
            </div>
            <h4 className="font-black text-sm uppercase text-brand-dark">60s IPFS Grievance</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Unhappy with food quality? Snap a photo or video. Evidence is pinned immutably to IPFS so no one can erase it.
            </p>
          </div>

          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-2xl p-5 shadow-neo space-y-3">
            <div className="w-8 h-8 rounded-full bg-brand-dark text-white font-black text-sm flex items-center justify-center border border-black">
              4
            </div>
            <h4 className="font-black text-sm uppercase text-brand-dark">5-Juror Verdict</h4>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              5 staked community peers review proof. Majority upholds your claim and triggers automatic contract refund.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate && onNavigate('how-it-works')}
            className="neo-btn-primary text-xs py-3 px-8 uppercase tracking-wider"
          >
            <span>Read Complete How It Works Architecture</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 7. ECOSYSTEM PORTALS */}
      <section className="space-y-6">
        <div className="border-b-2 border-brand-dark pb-3">
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-brand-dark tracking-tight">
            Ecosystem Portals
          </h2>
          <p className="text-xs text-gray-600 font-medium">
            FoodChain brings customers, culinary kitchens, delivery fleets, and community arbiters together.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            onClick={() => onGetStarted('customer')}
            className="bg-white border-2 border-brand-dark rounded-2xl p-6 shadow-neo space-y-3 cursor-pointer hover:border-brand-red transition-all group"
          >
            <div className="w-12 h-12 bg-brand-red text-white rounded-xl flex items-center justify-center border-2 border-black group-hover:scale-105 transition-transform">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase text-brand-dark">For Diners</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Explore authentic Bangalore restaurants with guaranteed delivery and fast, fair on-chain refunds.
            </p>
            <div className="text-xs font-black text-brand-red flex items-center gap-1 pt-2">
              <span>Order Food Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onGetStarted('juror')}
            className="bg-white border-2 border-brand-dark rounded-2xl p-6 shadow-neo space-y-3 cursor-pointer hover:border-brand-red transition-all group"
          >
            <div className="w-12 h-12 bg-brand-dark text-white rounded-xl flex items-center justify-center border-2 border-black group-hover:scale-105 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase text-brand-dark">For Jurors</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Stake test POL on Polygon Amoy, review photo/video evidence, and earn rewards for honest verdicts.
            </p>
            <div className="text-xs font-black text-brand-red flex items-center gap-1 pt-2">
              <span>Join Juror Pool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onGetStarted('restaurant')}
            className="bg-white border-2 border-brand-dark rounded-2xl p-6 shadow-neo space-y-3 cursor-pointer hover:border-brand-red transition-all group"
          >
            <div className="w-12 h-12 bg-brand-gray text-brand-dark rounded-xl flex items-center justify-center border-2 border-black group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase text-brand-dark">For Kitchens</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Restaurant owners & delivery partners: protect your reputation and revenue from fraudulent complaints.
            </p>
            <div className="text-xs font-black text-brand-red flex items-center gap-1 pt-2">
              <span>Partner Access</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. CONSUMER FINAL CALL TO ACTION */}
      <section className="bg-brand-red text-white border-2 border-brand-dark rounded-3xl p-8 sm:p-14 shadow-neo-lg flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-white text-brand-red text-xs font-black px-3.5 py-1 rounded-full border border-black shadow-neo-sm">
            <Smartphone className="w-4 h-4" />
            <span>PROGRESSIVE WEB APP READY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight leading-none">
            Eat with total peace of mind in Bangalore
          </h2>
          <p className="text-xs sm:text-sm text-red-100 font-medium leading-relaxed">
            Order authentic food from Truffles, Meghana Foods, CTR, Vidyarthi Bhavan, and more. Transparent escrow, zero bot refusals, 100% on-chain trust.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => onExploreRestaurants && onExploreRestaurants('')}
            className="bg-white text-brand-dark hover:bg-brand-gray border-2 border-brand-dark px-7 py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-neo text-center transition-all hover:-translate-y-0.5"
          >
            Explore Bangalore Restaurants
          </button>
          <button
            onClick={() => onNavigate && onNavigate('transparency')}
            className="bg-brand-dark text-white hover:bg-black border-2 border-brand-dark px-7 py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-neo text-center transition-all hover:-translate-y-0.5"
          >
            Dispute Explorer
          </button>
        </div>
      </section>
    </div>
  );
};
