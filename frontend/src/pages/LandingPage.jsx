import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  Users,
  Award,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Utensils,
  Store,
  Truck,
  Sparkles,
  Check,
  Lock,
  Camera,
  XCircle,
  AlertTriangle,
  Zap,
  HelpCircle,
  Flame,
  ThumbsUp,
  FileText,
  Bot,
  User,
  MessageSquare
} from 'lucide-react';
import { KAGGLE_RESTAURANTS } from '../data/zomatoRestaurants';

export const LandingPage = ({ onExploreRestaurants, onSelectRestaurant, onNavigate, onGetStarted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Bangalore, Central');
  const [activeCaseTab, setActiveCaseTab] = useState(0);

  const sampleGrievanceCases = [
    {
      id: 'CASE-104',
      title: 'Packaging Torn & Gravy Spilled',
      restaurant: 'Empire Restaurant • Indiranagar',
      complaintType: 'Damaged Packaging & Spillage',
      claimAmount: '₹340',
      refundStatus: '100% Refunded to Customer',
      resolutionTime: '84 seconds',
      evidenceType: 'IPFS Photo (CID: QmX8...3b9)',
      evidenceUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop',
      juryConsensus: '5 / 5 Jurors Voted Uphold',
      jurorReward: '+0.01 POL to each juror',
      customerStory: 'Delivered in a torn paper bag with curry leaking everywhere. Took 1 photo on my phone; 5 community jurors voted uphold in under 2 minutes and ₹340 was returned to my wallet automatically.',
    },
    {
      id: 'CASE-098',
      title: 'Wrong Burger & Missing Truffle Fries',
      restaurant: 'Truffles • Koramangala 5th Block',
      complaintType: 'Wrong / Incomplete Order',
      claimAmount: '₹220',
      refundStatus: 'Partial Refund Processed',
      resolutionTime: '112 seconds',
      evidenceType: 'IPFS Photo & Unboxing Receipt',
      evidenceUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop',
      juryConsensus: '4 / 5 Jurors Voted Uphold',
      jurorReward: '+0.01 POL to majority jurors',
      customerStory: 'Ordered All-American Cheese Burger + Fries, received a Veg Burger with no fries. Submitted photo proof to IPFS. Community jury confirmed discrepancy and escrow released the refund.',
    },
    {
      id: 'CASE-089',
      title: 'Food Arrived Completely Ice Cold (1h 15m delay)',
      restaurant: 'Meghana Foods • Residency Road',
      complaintType: 'Food Temperature & Extreme Delay',
      claimAmount: '₹360',
      refundStatus: 'Fault Accepted by Restaurant',
      resolutionTime: '45 seconds',
      evidenceType: 'Delivery Timestamp Proof',
      evidenceUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop',
      juryConsensus: 'Direct Auto-Resolution (Fault Accepted)',
      jurorReward: 'No Jury Needed (Reputation -5)',
      customerStory: 'Rider took over an hour and biryani was completely chilled. Kitchen saw the immutable timestamp, immediately accepted fault to avoid a jury penalty, and escrow refunded my order.',
    }
  ];

  const popularCuisines = [
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop' },
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop' },
    { name: 'South Indian', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=300&auto=format&fit=crop' },
    { name: 'Desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&auto=format&fit=crop' },
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
      {/* Hero Section */}
      <section className="relative bg-white border-2 border-brand-dark rounded-2xl overflow-hidden shadow-neo-lg">
        {/* Subtle decorative top bar */}
        <div className="h-2.5 bg-brand-red w-full"></div>

        <div className="p-6 sm:p-12 lg:p-16 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-brand-redLight border border-brand-red text-brand-red px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide">
            <ShieldCheck className="w-4 h-4 text-brand-red" />
            <span>100% QUALITY GUARANTEED • SMART CONTRACT ESCROW & JURY REDRESSAL</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-brand-dark tracking-tight uppercase leading-[1.05]">
              Never Get Cheated<br />
              <span className="text-brand-red">By An App Again.</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
              Order from Bangalore's most iconic restaurants with guaranteed protection. If food arrives cold, damaged, or wrong, file evidence in 60 seconds. Our decentralized community jury resolves grievances with automated on-chain refunds.
            </p>
          </div>

          {/* Search Bar Container */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white border-2 border-brand-dark p-2 sm:p-2.5 rounded-xl shadow-neo max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-2"
          >
            {/* Location Selector */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-black text-brand-dark border-b sm:border-b-0 sm:border-r-2 border-brand-dark w-full sm:w-auto shrink-0 bg-brand-grayLight rounded-md">
              <MapPin className="w-4 h-4 text-brand-red shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-bold"
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
                placeholder="Search for restaurants, cuisines, or a dish (e.g. Truffles, Biryani)..."
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-dark placeholder-gray-400 focus:outline-none"
              />
            </div>

            {/* Search Action Button */}
            <button
              type="submit"
              className="neo-btn-primary py-2.5 px-6 text-xs uppercase tracking-wider w-full sm:w-auto shrink-0"
            >
              <span>Search Food</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Cuisine Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold pt-2">
            <span className="text-gray-500">Popular:</span>
            {['Meghana Biryani', 'Truffles Burgers', 'Brik Oven Pizza', 'VB Masala Dosa', 'Corner House DBC'].map((tag) => (
              <button
                key={tag}
                onClick={() => onExploreRestaurants && onExploreRestaurants(tag.split(' ')[0])}
                className="px-3 py-1 bg-brand-gray border border-gray-300 rounded-full hover:border-brand-dark hover:bg-white text-gray-800 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Micro 3-Pill Trust Guarantee Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 bg-brand-grayLight py-2 px-3 rounded-lg border border-gray-200">
              <Lock className="w-4 h-4 text-brand-red shrink-0" />
              <span>Smart Contract Escrow</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 bg-brand-grayLight py-2 px-3 rounded-lg border border-gray-200">
              <Camera className="w-4 h-4 text-brand-red shrink-0" />
              <span>60s IPFS Photo Proof</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 bg-brand-grayLight py-2 px-3 rounded-lg border border-gray-200">
              <Users className="w-4 h-4 text-brand-red shrink-0" />
              <span>5-Juror Community Verdict</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE CORE USP: GRIEVANCE REDRESSAL SHOWCASE (HOOK SECTION) */}
      <section className="bg-white border-2 border-brand-dark rounded-2xl p-6 sm:p-12 shadow-neo-lg space-y-10">
        {/* Section Header with Prominent Motto Display */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand-dark text-white border-2 border-brand-dark px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-neo-sm">
            <ShieldCheck className="w-4 h-4 text-brand-red" />
            <span>OUR CONSUMER QUALITY GUARANTEE</span>
          </div>

          <div className="py-2">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-brand-dark tracking-tight leading-[1.1]">
              "Delicious Food.<br />
              <span className="text-brand-red bg-red-50 border-2 border-brand-dark px-4 py-1 rounded-xl shadow-neo inline-block mt-2">
                Zero Disappointment."
              </span>
            </h2>
          </div>

          <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed max-w-2xl mx-auto">
            We are ending the era of cold soup, broken packaging, and heartless support bots telling you to accept the loss. Every FoodChain delivery is locked in smart contract escrow until you receive what you paid for.
          </p>
        </div>

        {/* The Reality Check: Visual Comparison (Chatbot Loop vs Smart Redressal) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Mockup 1: Traditional Delivery App Support (The Painful Reality) */}
          <div className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
            {/* Window Header */}
            <div className="bg-gray-100 px-5 py-3 border-b-2 border-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <span className="text-xs font-bold text-gray-700 ml-1.5 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-gray-500" />
                  <span>Traditional Food App • Automated Support</span>
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                Unilateral Policy
              </span>
            </div>

            {/* Chat Simulation Area */}
            <div className="p-5 space-y-3.5 bg-gray-50/60 flex-1">
              {/* Customer message */}
              <div className="flex items-start gap-2.5 justify-end">
                <div className="bg-brand-dark text-white text-xs font-medium p-3 rounded-2xl rounded-tr-none max-w-[85%] space-y-1 shadow-sm">
                  <p>My Biryani arrived crushed and completely cold. The curry spilled all over the plastic bag.</p>
                  <div className="text-[10px] text-gray-400 text-right font-mono">Delivered 2m ago</div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0 text-gray-700">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Support Bot Automated Reply */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-brand-red">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 text-brand-dark text-xs p-3 rounded-2xl rounded-tl-none max-w-[85%] space-y-1 shadow-sm">
                  <div className="text-[10px] font-black uppercase text-brand-red tracking-wider">Automated Support Bot</div>
                  <p className="text-gray-700 leading-relaxed">
                    We regret the inconvenience. However, as per our Restaurant Cancellation & Transit Policy, once an order is marked delivered by the driver, we cannot issue a refund.
                  </p>
                </div>
              </div>

              {/* Customer Follow-up */}
              <div className="flex items-start gap-2.5 justify-end">
                <div className="bg-brand-dark text-white text-xs font-medium p-2.5 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                  <p>Can a human agent review this photo?</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shrink-0 text-gray-700">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Bot Closes Ticket */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-brand-red">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 text-brand-dark text-xs p-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-gray-500 italic">
                  All human agents are currently busy. Ticket #9204 has been closed automatically.
                </div>
              </div>
            </div>

            {/* Bottom Outcome Bar */}
            <div className="p-3.5 bg-red-50 border-t-2 border-red-200 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Result: ₹420 Lost • 45 Mins Wasted</span>
              </div>
              <span className="text-[10px] font-black uppercase text-red-800 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                Zero Recourse
              </span>
            </div>
          </div>

          {/* Mockup 2: FoodChain Smart Redressal Protocol (The Decentralized Fix) */}
          <div className="bg-white border-2 border-brand-dark rounded-2xl overflow-hidden flex flex-col justify-between shadow-neo">
            {/* Window Header */}
            <div className="bg-brand-redLight px-5 py-3 border-b-2 border-brand-dark flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-red" />
                <span className="text-xs font-black uppercase text-brand-dark tracking-wide">FoodChain Smart Redressal Protocol</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-brand-red border border-brand-dark px-2.5 py-0.5 rounded shadow-neo-sm">
                Smart Contract Escrow
              </span>
            </div>

            {/* Visual Process Flow */}
            <div className="p-6 space-y-5 bg-white flex-1 flex flex-col justify-center">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border-2 border-brand-dark flex items-center justify-center shrink-0 text-brand-red shadow-neo-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-brand-dark flex items-center gap-2">
                    <span>1. Automatic Escrow Lock</span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border">Polygon Amoy</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Payment is anchored in the smart contract escrow. Funds are never released to the restaurant until safe delivery is verified.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 border-2 border-brand-dark flex items-center justify-center shrink-0 text-yellow-800 shadow-neo-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-brand-dark flex items-center gap-2">
                    <span>2. 60-Second Immutable IPFS Evidence</span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border">Pinata IPFS</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    Customer snaps a quick photo of the spilled box. Evidence is permanently pinned to IPFS and cannot be erased or hidden by anyone.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 border-2 border-brand-dark flex items-center justify-center shrink-0 text-green-700 shadow-neo-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-brand-dark flex items-center gap-2">
                    <span>3. 5-Juror Community Arbitration</span>
                    <span className="text-[10px] font-black text-green-700 bg-green-100 px-1.5 py-0.2 rounded border border-green-300">5/5 Consensus</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    5 staked community peers review proof on-chain. Fair jurors are rewarded, and consensus automatically triggers your refund.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Outcome Bar */}
            <div className="p-3.5 bg-green-50 border-t-2 border-brand-dark flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2 text-green-800 font-black">
                <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                <span>Result: ₹420 Auto-Refunded to Wallet in 84s</span>
              </div>
              <span className="text-[10px] font-black uppercase text-green-900 bg-green-200 border border-green-400 px-2 py-0.5 rounded">
                100% Protected
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Live Case Inspector: Hooking the User with Real Grievance Scenarios */}
        <div className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-brand-dark pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <h3 className="font-black text-base uppercase text-brand-dark">
                  Live Grievance Redressal in Action
                </h3>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Select a real dispute case to see how the decentralized jury examined evidence and issued refunds
              </p>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {sampleGrievanceCases.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCaseTab(idx)}
                  className={`text-xs font-black px-3 py-1.5 border-2 border-brand-dark rounded transition-all whitespace-nowrap ${
                    activeCaseTab === idx
                      ? 'bg-brand-red text-white shadow-neo-sm'
                      : 'bg-brand-gray text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.id}
                </button>
              ))}
            </div>
          </div>

          {/* Active Case Details Card */}
          {(() => {
            const current = sampleGrievanceCases[activeCaseTab];
            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Evidence Preview Image */}
                <div className="md:col-span-4 relative rounded-lg overflow-hidden border-2 border-brand-dark h-48 bg-gray-100">
                  <img
                    src={current.evidenceUrl}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-brand-dark text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 border border-black">
                    <Camera className="w-3 h-3 text-brand-red" />
                    <span>IPFS Verified Photo</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white text-brand-dark text-[10px] font-black px-2 py-0.5 rounded border border-black shadow-neo-sm">
                    Claim: {current.claimAmount}
                  </div>
                </div>

                {/* Case Timeline & Verdict */}
                <div className="md:col-span-8 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-brand-red tracking-wider block">
                        {current.complaintType}
                      </span>
                      <h4 className="font-black text-base text-brand-dark">{current.title}</h4>
                      <span className="text-gray-500 font-medium">{current.restaurant}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-green-100 text-green-900 border border-green-300 font-black rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                      <span>{current.refundStatus}</span>
                    </span>
                  </div>

                  <p className="text-xs bg-gray-50 border border-gray-300 p-3 rounded text-gray-700 italic font-medium leading-relaxed">
                    "{current.customerStory}"
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
                    <div className="p-2 bg-brand-grayLight border border-gray-200 rounded">
                      <span className="text-gray-500 block text-[9px] uppercase">Resolution Time</span>
                      <span className="font-black text-brand-dark">{current.resolutionTime}</span>
                    </div>
                    <div className="p-2 bg-brand-grayLight border border-gray-200 rounded">
                      <span className="text-gray-500 block text-[9px] uppercase">Jury Vote Tally</span>
                      <span className="font-black text-green-800">{current.juryConsensus}</span>
                    </div>
                    <div className="p-2 bg-brand-grayLight border border-gray-200 rounded">
                      <span className="text-gray-500 block text-[9px] uppercase">Juror Incentive</span>
                      <span className="font-black text-purple-800">{current.jurorReward}</span>
                    </div>
                    <div className="p-2 bg-brand-grayLight border border-gray-200 rounded">
                      <span className="text-gray-500 block text-[9px] uppercase">Network</span>
                      <span className="font-black text-brand-red">Polygon Amoy</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Direct Call to Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
            <span className="text-xs text-gray-600 font-bold text-center sm:text-left">
              All dispute cases, evidence hashes, and juror votes are 100% public on Polygon Amoy.
            </span>
            <button
              onClick={() => onNavigate && onNavigate('transparency')}
              className="neo-btn-primary text-xs py-2 px-5 whitespace-nowrap uppercase tracking-wider"
            >
              <span>Open On-Chain Dispute Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Visual Food Categories Section */}
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
              className="bg-white border-2 border-brand-dark rounded-xl p-3 shadow-neo hover:-translate-y-1 transition-all cursor-pointer text-center space-y-2 group"
            >
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-brand-dark bg-gray-100">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="font-black text-xs text-brand-dark group-hover:text-brand-red transition-colors">
                {c.name}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Top Bangalore Brands (Kaggle Zomato Dataset) */}
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
              className="bg-white border-2 border-brand-dark rounded-xl overflow-hidden shadow-neo hover:-translate-y-1 transition-all duration-150 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden border-b-2 border-brand-dark bg-gray-100">
                  <img
                    src={res.imageUrl}
                    alt={res.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {res.offer && (
                    <div className="absolute bottom-2.5 left-2.5 bg-brand-red text-white text-[11px] font-black px-2.5 py-1 border border-black rounded shadow-neo-sm">
                      {res.offer}
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 bg-white border border-black text-brand-dark text-xs font-black px-2.5 py-0.5 rounded flex items-center gap-1 shadow-neo-sm">
                    <Clock className="w-3.5 h-3.5 text-brand-red" />
                    <span>{res.deliveryTime}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-brand-dark group-hover:text-brand-red transition-colors">
                        {res.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-1">{res.tagline}</p>
                    </div>

                    <div className="bg-green-700 text-white font-black text-xs px-2 py-1 rounded flex items-center gap-1 shrink-0 border border-black">
                      <span>{res.rating}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 font-semibold line-clamp-1">
                    {res.cuisine.join(', ')}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100 font-medium">
                    <span>{res.address}</span>
                    <span className="font-bold text-brand-dark">₹{res.costForTwo} for two</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-brand-grayLight border-t-2 border-brand-dark flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-brand-dark font-black">
                  <ShieldCheck className="w-4 h-4 text-brand-red" />
                  <span>Trust Score: {res.reputationScore}/100</span>
                </div>
                <span className="font-bold text-brand-red flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>View Menu</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Consumer Value Proposition: The FoodChain Trust Guarantee */}
      <section className="bg-white border-2 border-brand-dark rounded-2xl p-8 sm:p-12 shadow-neo space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-gray border border-brand-dark text-brand-dark px-3 py-1 rounded text-xs font-black">
            <Lock className="w-3.5 h-3.5 text-brand-red" />
            <span>CONSUMER ADVOCACY & DISPUTE REDRESSAL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-brand-dark tracking-tight">
            Why FoodChain Is Safer Than Traditional Apps
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            We removed unilateral corporate decision-making. No AI bots deciding whether your soggy food deserves a refund.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-3">
            <div className="w-10 h-10 bg-brand-red text-white rounded-lg flex items-center justify-center border border-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base uppercase text-brand-dark">Immutable IPFS Evidence</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Upload photos or video of wrong, cold, or damaged food. Evidence is pinned to decentralized IPFS via Pinata, meaning platforms cannot delete your proof.
            </p>
          </div>

          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-3">
            <div className="w-10 h-10 bg-brand-red text-white rounded-lg flex items-center justify-center border border-black">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base uppercase text-brand-dark">Decentralized Peer Jury</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Contested complaints are judged by 5 staked community peers. Honest majority votes are rewarded while dishonest voters are economically slashed.
            </p>
          </div>

          <div className="bg-brand-grayLight border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-3">
            <div className="w-10 h-10 bg-brand-red text-white rounded-lg flex items-center justify-center border border-black">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base uppercase text-brand-dark">Dynamic Reputation Scores</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Restaurants and drivers maintain on-chain reputation scores (0-100) on Polygon Amoy. Bad actors cannot delete bad scores or buy fake reviews.
            </p>
          </div>
        </div>

        {/* Explore Transparency Link */}
        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate && onNavigate('transparency')}
            className="neo-btn-primary text-xs py-3 px-6 uppercase tracking-wider"
          >
            <span>Explore Live On-Chain Disputes Explorer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Platform Live Stats Bar */}
      <section className="bg-brand-dark text-white border-2 border-brand-dark rounded-xl p-8 shadow-neo grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-3xl sm:text-4xl font-black text-brand-red">1,400+</div>
          <p className="text-xs font-bold text-gray-300 uppercase mt-1">Grievances Redressed</p>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white">3.8 mins</div>
          <p className="text-xs font-bold text-gray-300 uppercase mt-1">Avg. Settlement Time</p>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-brand-red">340+</div>
          <p className="text-xs font-bold text-gray-300 uppercase mt-1">Staked Community Jurors</p>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white">100%</div>
          <p className="text-xs font-bold text-gray-300 uppercase mt-1">Publicly Verifiable Audits</p>
        </div>
      </section>

      {/* Partner & Stakeholder Portals (Clean, Professional) */}
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
            className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-3 cursor-pointer hover:border-brand-red transition-all"
          >
            <div className="w-10 h-10 bg-brand-red text-white rounded-lg flex items-center justify-center border border-black">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase text-brand-dark">For Foodies</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Explore authentic Bangalore restaurants with guaranteed delivery and fast, fair refunds.
            </p>
            <div className="text-xs font-black text-brand-red flex items-center gap-1 pt-1">
              <span>Order Food Now</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => onGetStarted('juror')}
            className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-3 cursor-pointer hover:border-brand-red transition-all"
          >
            <div className="w-10 h-10 bg-brand-dark text-white rounded-lg flex items-center justify-center border border-black">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase text-brand-dark">For Jurors</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Stake test POL on Polygon Amoy, review photo/video evidence, and earn rewards for honest verdicts.
            </p>
            <div className="text-xs font-black text-brand-red flex items-center gap-1 pt-1">
              <span>Join Juror Pool</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => onGetStarted('restaurant')}
            className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-3 cursor-pointer hover:border-brand-red transition-all"
          >
            <div className="w-10 h-10 bg-brand-gray text-brand-dark rounded-lg flex items-center justify-center border border-black">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black uppercase text-brand-dark">For Partners</h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              Restaurant owners and delivery partners: protect your reputation from fraudulent complaints.
            </p>
            <div className="text-xs font-black text-brand-red flex items-center gap-1 pt-1">
              <span>Partner Access</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Download App / Consumer CTA */}
      <section className="bg-brand-red text-white border-2 border-brand-dark rounded-2xl p-8 sm:p-12 shadow-neo flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left max-w-xl">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Order from anywhere in Bangalore with total peace of mind
          </h2>
          <p className="text-xs sm:text-sm text-red-100 font-medium leading-relaxed">
            Install FoodChain on your phone or tablet. Connect MetaMask in one click and track meals live with zero opaque policies.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => onExploreRestaurants && onExploreRestaurants('')}
            className="bg-white text-brand-dark hover:bg-brand-gray border-2 border-brand-dark px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-neo text-center"
          >
            Explore Bangalore Restaurants
          </button>
          <button
            onClick={() => onNavigate && onNavigate('how-it-works')}
            className="bg-brand-dark text-white hover:bg-black border-2 border-brand-dark px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-neo text-center"
          >
            Read Whitepaper Spec
          </button>
        </div>
      </section>
    </div>
  );
};
