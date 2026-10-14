import React from 'react';
import {
  ShoppingBag,
  Truck,
  FileText,
  Scale,
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

export const HowItWorksPage = ({ onGetStarted }) => {
  const steps = [
    {
      num: '01',
      title: 'Order Placement & Smart Anchoring',
      desc: 'Browse verified Bangalore restaurants and authentic menus. When you place an order, items stay fast in MongoDB while an immutable cryptographic hash is anchored to the OrderRegistry contract via the backend relayer.',
      icon: ShoppingBag,
    },
    {
      num: '02',
      title: 'Real-Time Progression & Telemetry',
      desc: 'Watch your order advance in real time via Socket.io: PLACED → ACCEPTED → PREPARING → OUT FOR DELIVERY → DELIVERED. Each state change logs timestamps on-chain, proving exact delivery times beyond dispute.',
      icon: Truck,
    },
    {
      num: '03',
      title: '60-Second Grievance Filing with IPFS Evidence',
      desc: 'Unhappy with quality, cold food, missing items, or hygiene? File a grievance in 60 seconds. Upload photos or video of the meal. Your evidence is pinned directly to IPFS via Pinata and its CID is written to ComplaintRegistry.',
      icon: FileText,
    },
    {
      num: '04',
      title: 'Decentralized Jury Voting & Fair Settlement',
      desc: 'If the restaurant contests your complaint, a pool of 5 independent community jurors (who staked POL) is pseudo-randomly assigned. Jurors inspect your IPFS photos and cast votes. The majority verdict settles refunds, rewards honest jurors, and automatically adjusts on-chain reputation scores.',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-12 py-6">
      {/* Header */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-8 sm:p-12 shadow-neo text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-redLight text-brand-red text-xs font-black px-3 py-1 rounded border border-brand-red">
          <ShieldCheck className="w-4 h-4" />
          <span>FOODCHAIN ARCHITECTURE & CONSUMER PROTOCOL</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-brand-dark tracking-tight">
          How FoodChain Protects Every Meal
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Traditional food delivery apps use opaque customer support bots that often reject legitimate refund requests. FoodChain decentralizes grievance redressal using Ethereum-compatible smart contracts, IPFS, and peer staking.
        </p>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-4 hover:border-brand-red transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-brand-red">{s.num}</span>
                  <div className="p-3 bg-brand-redLight text-brand-red rounded-lg border border-brand-red">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase text-brand-dark">{s.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Fully automated smart contract execution</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison: Traditional Apps vs FoodChain */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-6 sm:p-8 shadow-neo space-y-6">
        <div className="border-b-2 border-brand-dark pb-3">
          <h2 className="text-2xl font-black uppercase text-brand-dark">
            Traditional Food Delivery vs. FoodChain
          </h2>
          <p className="text-xs text-gray-600 font-medium">
            Why decentralized dispute resolution is fundamentally superior for consumers and restaurants.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-brand-dark text-gray-500 font-black uppercase">
                <th className="py-3 px-3">Feature</th>
                <th className="py-3 px-3 text-red-700">Traditional Platforms</th>
                <th className="py-3 px-3 text-green-800">FoodChain Decentralized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              <tr>
                <td className="py-3 px-3 font-bold text-brand-dark">Dispute Arbiter</td>
                <td className="py-3 px-3 text-red-600 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Automated Chatbots & Biased Support Reps</span>
                </td>
                <td className="py-3 px-3 text-green-700 font-bold">
                  <span>5 Peer Community Jurors Staked with Tokens</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-brand-dark">Evidence Storage</td>
                <td className="py-3 px-3 text-red-600 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Private Centralized Servers (often deleted)</span>
                </td>
                <td className="py-3 px-3 text-green-700 font-bold">
                  <span>Pinata IPFS (Immutable CIDs pinned globally)</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-brand-dark">Restaurant Reputation</td>
                <td className="py-3 px-3 text-red-600 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Opaque star reviews prone to manipulation</span>
                </td>
                <td className="py-3 px-3 text-green-700 font-bold">
                  <span>On-Chain Score (0-100) mathematically adjusted</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-brand-dark">Resolution Speed</td>
                <td className="py-3 px-3 text-red-600 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>24–72 hours of back-and-forth emails</span>
                </td>
                <td className="py-3 px-3 text-green-700 font-bold">
                  <span>2–4 minutes voting window per dispute case</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ready to Order CTA */}
      <div className="bg-brand-red text-white border-2 border-brand-dark rounded-xl p-8 shadow-neo flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl sm:text-3xl font-black uppercase">Experience Fair Food Delivery Today</h3>
          <p className="text-xs sm:text-sm text-red-100 font-medium max-w-xl">
            Order from top Bangalore restaurants with absolute peace of mind backed by Ethereum smart contracts.
          </p>
        </div>

        <button
          onClick={() => onGetStarted('customer')}
          className="bg-white text-brand-dark hover:bg-brand-gray border-2 border-brand-dark px-6 py-3 font-black text-xs uppercase tracking-wider rounded-lg shadow-neo shrink-0"
        >
          Explore Bangalore Restaurants
        </button>
      </div>
    </div>
  );
};
