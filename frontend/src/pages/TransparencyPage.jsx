import React, { useState } from 'react';
import {
  ShieldCheck,
  Scale,
  ExternalLink,
  CheckCircle2,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  Lock,
  Search,
  Eye
} from 'lucide-react';
import { BLOCK_EXPLORER_URL } from '../config';

export const TransparencyPage = () => {
  const [selectedCase, setSelectedCase] = useState(null);

  const smartContracts = [
    { name: 'UserRegistry', address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', desc: 'Wallet-to-role mappings, verified credentials, and juror stake pool custody.' },
    { name: 'OrderRegistry', address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', desc: 'On-chain cryptographic anchors linking MongoDB orders, participants, and delivery handshakes.' },
    { name: 'ReputationManager', address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', desc: 'Dynamic score ledger (0-100, baseline 70) updated strictly by dispute verdicts.' },
    { name: 'ComplaintRegistry', address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9', desc: 'Immutable dispute intake holding Pinata IPFS evidence CIDs and respondent fault admissions.' },
    { name: 'DisputeResolution', address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', desc: 'Pseudo-random 5-juror assignment, voting windows, majority rewards, and slashing.' },
  ];

  const recentDisputes = [
    {
      id: "DISP-1092",
      restaurant: "Truffles St. Marks",
      filer: "0x1111...1111",
      category: "FoodQuality",
      description: "Burger delivered cold and smashed; cheese was congealed and patty burnt.",
      evidenceCID: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      verdict: "Upheld (4 - 1)",
      status: "Resolved",
      penaltyApplied: "-10 Reputation for Truffles",
      jurorReward: "0.005 POL credited to 4 majority jurors",
      resolvedAt: "25 mins ago",
    },
    {
      id: "DISP-1088",
      restaurant: "Meghana Foods Koramangala",
      filer: "0x4444...9999",
      category: "WrongOrMissingItem",
      description: "Ordered 2 Special Biryanis and 1 Chili Prawns, but Chili Prawns was missing from sealed package.",
      evidenceCID: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      verdict: "Auto-Resolved (Fault Accepted)",
      status: "AutoResolved",
      penaltyApplied: "-10 Reputation for Meghana Foods",
      jurorReward: "Instant refund dispatched to customer",
      resolvedAt: "2 hours ago",
    },
    {
      id: "DISP-1074",
      restaurant: "Onesta Indiranagar",
      filer: "0x8888...2222",
      category: "HygienePackaging",
      description: "Pizza box was torn open and tamper seal broken upon delivery.",
      evidenceCID: "QmZtmD2qt8STQgPRjUvxDPjdEu6nvubb16EndlnxBreJaS",
      verdict: "Upheld (5 - 0 Unanimous)",
      status: "Resolved",
      penaltyApplied: "-10 Delivery Partner Reputation",
      jurorReward: "0.005 POL credited to all 5 jurors",
      resolvedAt: "Yesterday",
    },
  ];

  return (
    <div className="space-y-10 py-6">
      {/* Header Banner */}
      <div className="bg-brand-dark text-white border-2 border-brand-dark rounded-xl p-8 sm:p-12 shadow-neo space-y-4">
        <div className="inline-flex items-center gap-2 bg-brand-red text-white text-xs font-black px-3 py-1 rounded border border-white">
          <ShieldCheck className="w-4 h-4" />
          <span>POLYGON AMOY & IPFS TRANSPARENCY PROTOCOL</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
          Food Grievance Redressal Explorer
        </h1>
        <p className="text-sm sm:text-base text-gray-300 font-medium max-w-3xl leading-relaxed">
          Every complaint, evidence submission, jury vote, and reputation penalty on FoodChain is permanently verifiable on-chain. No closed-door decisions, no canned chatbot rejections.
        </p>
      </div>

      {/* Protocol Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Disputes Resolved', value: '1,428', note: '100% on-chain audit trail' },
          { label: 'Avg Resolution Time', value: '3.8 min', note: 'Fastest in food delivery' },
          { label: 'Active Juror Pool', value: '340+ Wallets', note: 'Staked with test POL' },
          { label: 'Fair Outcome Rate', value: '98.4%', note: 'Community verified majority' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border-2 border-brand-dark p-5 rounded-xl shadow-neo space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase">{stat.label}</span>
            <div className="text-2xl sm:text-3xl font-black text-brand-dark">{stat.value}</div>
            <p className="text-[11px] font-semibold text-brand-red">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Verified Smart Contracts Table */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-brand-dark pb-4">
          <div>
            <h2 className="text-xl font-black uppercase text-brand-dark flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-red" />
              <span>Polygon Amoy Smart Contracts</span>
            </h2>
            <p className="text-xs text-gray-600 font-medium">Single-responsibility contracts governing platform mechanics.</p>
          </div>
          <span className="text-xs font-black bg-brand-gray px-3 py-1.5 rounded-md border border-brand-dark">
            Chain ID: 80002
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-brand-dark text-gray-500 font-black uppercase">
                <th className="py-2.5 px-3">Contract Name</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold">
              {smartContracts.map((c) => (
                <tr key={c.name} className="hover:bg-brand-grayLight transition-colors">
                  <td className="py-3 px-3 font-black text-brand-dark">{c.name}</td>
                  <td className="py-3 px-3 text-gray-600 max-w-xs sm:max-w-md">{c.desc}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-gray-800">{c.address}</td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`${BLOCK_EXPLORER_URL}/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-red font-black hover:underline"
                    >
                      <span>Verify</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Public Disputes Log */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-6">
        <div className="flex items-center justify-between border-b-2 border-brand-dark pb-4">
          <div>
            <h2 className="text-xl font-black uppercase text-brand-dark flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-red" />
              <span>Recent Public Dispute Resolutions</span>
            </h2>
            <p className="text-xs text-gray-600 font-medium">Real complaints settled via Pinata IPFS evidence and 5-juror consensus.</p>
          </div>
        </div>

        <div className="space-y-4">
          {recentDisputes.map((d) => (
            <div
              key={d.id}
              className="border-2 border-brand-dark rounded-xl p-5 hover:border-brand-red transition-colors space-y-3 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black bg-brand-gray px-2 py-0.5 rounded border border-brand-dark">{d.id}</span>
                  <span className="font-bold text-brand-dark">{d.restaurant}</span>
                  <span className="text-gray-500">• {d.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">{d.resolvedAt}</span>
                  <span className="font-black px-2 py-0.5 rounded text-[11px] bg-green-100 text-green-800 border border-green-800">
                    {d.verdict}
                  </span>
                </div>
              </div>

              <p className="text-xs font-medium text-gray-800 bg-brand-grayLight p-3 rounded border border-gray-200">
                "{d.description}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-gray-600 pt-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-500">IPFS: {d.evidenceCID.slice(0, 16)}...</span>
                  <span className="text-brand-red font-bold">{d.penaltyApplied}</span>
                </div>

                <div className="text-green-700 font-bold">
                  {d.jurorReward}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
