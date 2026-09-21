import React from 'react';
import { Shield, Sparkles, Scale, Cpu, ArrowRight, Award, Lock } from 'lucide-react';

export const LandingPage = ({ onGetStarted }) => {
  const roles = [
    {
      role: 'customer',
      title: 'Customer',
      icon: '🍔',
      desc: 'Browse restaurants, place orders, track live status, and file grievances with IPFS-pinned photo/video evidence.',
      color: 'bg-orange-100',
    },
    {
      role: 'restaurant',
      title: 'Restaurant',
      icon: '🍳',
      desc: 'Manage kitchen orders, accept fault or contest complaints before a decentralized jury, build on-chain trust.',
      color: 'bg-red-100',
    },
    {
      role: 'delivery_partner',
      title: 'Delivery Partner',
      icon: '🛵',
      desc: 'Accept assignments, advance delivery status, protect your reputation score from wrongful delays.',
      color: 'bg-green-100',
    },
    {
      role: 'juror',
      title: 'Decentralized Juror',
      icon: '⚖️',
      desc: 'Stake test POL, review contested complaint evidence from IPFS, cast votes, earn rewards for majority consensus.',
      color: 'bg-purple-100',
    },
    {
      role: 'admin',
      title: 'Admin (God-Mode)',
      icon: '⚡',
      desc: 'Full system control for live viva demonstrations: force order states, seed data, emergency dispute finalization.',
      color: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="border-4 border-black bg-brand-yellow p-8 sm:p-12 shadow-neo-lg text-brand-dark">
        <div className="max-w-3xl space-y-6">
          <div className="inline-block bg-white border-2 border-black px-3 py-1 font-black text-xs uppercase tracking-wider">
            Web3 • IPFS • Decentralized Jury • Polygon Amoy
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight uppercase">
            Transparent Food Delivery & Grievance Redressal
          </h1>
          <p className="font-bold text-base sm:text-lg text-gray-900 leading-relaxed">
            Eliminating opaque dispute resolution in food delivery. Realistic 3-sided order flow backed by immutable smart contracts on Polygon Amoy, Pinata IPFS evidence pinning, and decentralized community jury voting.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onGetStarted('customer')}
              className="neo-btn-primary text-base py-3 px-6 flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onGetStarted('juror')}
              className="neo-btn-secondary text-base py-3 px-6 flex items-center gap-2"
            >
              <span>Join Juror Pool</span>
              <Scale className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Role Picker Section */}
      <section className="space-y-6">
        <div className="border-b-4 border-black pb-3">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Explore System Roles
          </h2>
          <p className="font-bold text-xs text-gray-600">
            Select a role to test its end-to-end interface and contract interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((item) => (
            <div
              key={item.role}
              onClick={() => onGetStarted(item.role)}
              className={`neo-card p-6 cursor-pointer hover:-translate-y-1 transition-all ${item.color} flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-3">
                <div className="text-4xl">{item.icon}</div>
                <h3 className="text-xl font-black uppercase">{item.title}</h3>
                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t-2 border-black flex justify-between items-center text-xs font-black">
                <span>Enter as {item.title}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real vs Simulated Reality Check */}
      <section className="neo-card p-6 bg-white space-y-4">
        <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-red" />
          <span>System Architecture & Viva Spec</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="border-2 border-black p-3 bg-brand-muted space-y-1">
            <span className="font-black text-brand-dark uppercase">⛓️ On-Chain Smart Contracts</span>
            <p>Deals with user roles, order key integrity, complaint registration, decentralized jury selection, stake slashing/rewards, and dynamic reputation scores on Polygon Amoy.</p>
          </div>
          <div className="border-2 border-black p-3 bg-brand-muted space-y-1">
            <span className="font-black text-brand-dark uppercase">📦 IPFS Evidence Pinning</span>
            <p>Customer grievance photos and videos are directly uploaded to Pinata IPFS; CIDs are stored immutably inside the Solidity ComplaintRegistry.</p>
          </div>
          <div className="border-2 border-black p-3 bg-brand-muted space-y-1">
            <span className="font-black text-brand-dark uppercase">⚡ Real-Time Socket.io</span>
            <p>Live order status machine automatically shifts orders through PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED with manual overrides.</p>
          </div>
          <div className="border-2 border-black p-3 bg-brand-muted space-y-1">
            <span className="font-black text-brand-dark uppercase">🍔 Kaggle Zomato Dataset</span>
            <p>Pre-seeded with iconic Bangalore restaurants and authentic menus directly derived from the Kaggle Zomato dataset.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
