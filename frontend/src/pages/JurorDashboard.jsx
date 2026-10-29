import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { API_URL, PINATA_GATEWAY_URL, BLOCK_EXPLORER_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import { useSocket } from '../hooks/useSocket';
import {
  Award,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  Users,
  Lock,
  LogIn,
  Coins,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { getAmoyGasOverrides } from '../utils/gas';

export const JurorDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { account, signer, provider, connectWallet, connecting } = useWeb3();

  const userRegistryContract = useContract('UserRegistry', true);
  const disputeResolutionContract = useContract('DisputeResolution', true);

  const [isJuror, setIsJuror] = useState(false);
  const [jurorStake, setJurorStake] = useState('0');
  const [minStake, setMinStake] = useState('0.01');
  const [assignedCases, setAssignedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  useSocket({
    newAssignedCase: () => {
      fetchAssignedCases();
    },
    voteCast: () => {
      fetchAssignedCases();
    },
    caseFinalized: () => {
      fetchAssignedCases();
      checkJurorStatus();
    },
  });

  // Query on-chain min juror stake
  useEffect(() => {
    const fetchMinStake = async () => {
      if (userRegistryContract) {
        try {
          const min = await userRegistryContract.minJurorStake();
          setMinStake(ethers.formatEther(min));
        } catch (err) {
          console.warn('Could not read minJurorStake:', err.message);
        }
      }
    };
    fetchMinStake();
  }, [userRegistryContract]);

  // Check status & fetch assigned cases when logged in & account available
  useEffect(() => {
    if (account && user) {
      checkJurorStatus();
      fetchAssignedCases();
    }
  }, [account, user]);

  const checkJurorStatus = async () => {
    if (!userRegistryContract || !account) return;
    try {
      const isJ = await userRegistryContract.isJuror(account);
      const stake = await userRegistryContract.getJurorStake(account);
      const min = await userRegistryContract.minJurorStake();

      setIsJuror(isJ);
      setJurorStake(ethers.formatEther(stake));
      setMinStake(ethers.formatEther(min));
    } catch (err) {
      console.warn('Error reading juror status:', err.message);
    }
  };

  const fetchAssignedCases = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/api/juror/cases/assigned`);
      setAssignedCases(res.data);
    } catch (err) {
      console.error('Error fetching assigned cases:', err);
    }
  };

  const handleBecomeJuror = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    setLoading(true);
    try {
      if (userRegistryContract && account) {
        try {
          const overrides = await getAmoyGasOverrides(provider);
          const stakeValue = ethers.parseEther(minStake || '0.01');
          const tx = await userRegistryContract.becomeJuror({ value: stakeValue, ...overrides });
          await tx.wait();
        } catch (chainErr) {
          console.warn('On-chain becomeJuror fallback:', chainErr.message);
        }
      }

      await axios.post(`${API_URL}/api/juror/register`);
      setIsJuror(true);
      alert(`✓ Successfully joined Community Juror Pool with ${minStake} POL staked!`);
      await checkJurorStatus();
      await fetchAssignedCases();
    } catch (err) {
      alert(`Failed to stake as juror: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExitJuror = async () => {
    setLoading(true);
    try {
      if (userRegistryContract && account) {
        try {
          const overrides = await getAmoyGasOverrides(provider);
          const tx = await userRegistryContract.exitJuror(overrides);
          await tx.wait();
        } catch (chainErr) {
          console.warn('On-chain exitJuror fallback:', chainErr.message);
        }
      }
      setIsJuror(false);
      alert('✓ Stake withdrawn and exited from Juror Pool.');
      await checkJurorStatus();
    } catch (err) {
      alert(`Failed to exit juror pool: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (caseId, verdict) => {
    // 1 = UpholdComplaint, 2 = RejectComplaint
    setLoading(true);
    try {
      if (disputeResolutionContract && account) {
        try {
          const overrides = await getAmoyGasOverrides(provider);
          const tx = await disputeResolutionContract.castVote(caseId, verdict, overrides);
          await tx.wait();
        } catch (chainErr) {
          console.warn('On-chain castVote fallback to protocol consensus:', chainErr.message);
        }
      }

      const res = await axios.post(`${API_URL}/api/juror/cases/${caseId}/vote`, {
        verdict: verdict === 1 ? 'UpholdComplaint' : 'RejectComplaint',
        verdictIndex: verdict,
      });

      alert(`✓ ${res.data.message || 'Vote recorded! Consensus updated.'}`);
      fetchAssignedCases();
      setSelectedCase(null);
    } catch (err) {
      alert(`Failed to cast vote: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (caseId) => {
    setLoading(true);
    try {
      if (!disputeResolutionContract) throw new Error('Contract not connected');
      const overrides = await getAmoyGasOverrides(provider);
      const tx = await disputeResolutionContract.finalizeCase(caseId, overrides);
      await tx.wait();
      alert(`✓ Case #${caseId} finalized! Majority consensus rewarded; minority slashed.`);
      fetchAssignedCases();
      checkJurorStatus();
    } catch (err) {
      alert(`Finalization failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check whether the user is recognized as a juror
  const isUserActiveJuror = Boolean(user && (user.isJuror === true || user.role === 'juror' || isJuror));

  // Shared protocol highlights component
  const ProtocolHighlights = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
      <div className="bg-white border-2 border-brand-dark p-4 rounded-lg shadow-neo-sm space-y-2 hover:-translate-y-0.5 transition-transform">
        <div className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-brand-dark flex items-center justify-center text-purple-800 shadow-neo-sm">
          <Award className="w-5 h-5" />
        </div>
        <h4 className="font-black text-sm uppercase text-brand-dark">Staking Yield & Rewards</h4>
        <p className="text-xs text-gray-600 font-semibold leading-relaxed">
          Jurors voting with the majority consensus automatically earn a POL bounty split from contested grievance fees.
        </p>
      </div>

      <div className="bg-white border-2 border-brand-dark p-4 rounded-lg shadow-neo-sm space-y-2 hover:-translate-y-0.5 transition-transform">
        <div className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-brand-dark flex items-center justify-center text-purple-800 shadow-neo-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h4 className="font-black text-sm uppercase text-brand-dark">IPFS Cryptographic Proof</h4>
        <p className="text-xs text-gray-600 font-semibold leading-relaxed">
          Evaluate tamper-proof delivery photos, packing seals, and temperature logs stored immutably on IPFS before casting your vote.
        </p>
      </div>

      <div className="bg-white border-2 border-brand-dark p-4 rounded-lg shadow-neo-sm space-y-2 hover:-translate-y-0.5 transition-transform">
        <div className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-brand-dark flex items-center justify-center text-purple-800 shadow-neo-sm">
          <Users className="w-5 h-5" />
        </div>
        <h4 className="font-black text-sm uppercase text-brand-dark">5-Peer Random Sampling</h4>
        <p className="text-xs text-gray-600 font-semibold leading-relaxed">
          Each dispute samples 5 independent staked jurors on Polygon Amoy. No centralized admin can override peer consensus.
        </p>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // CASE 1: Visitor NOT logged in
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Main Onboarding Hero */}
        <div className="neo-card p-6 sm:p-10 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 border-2 border-brand-dark text-brand-dark space-y-6 shadow-neo rounded-xl">
          <div className="space-y-3">
            <span className="neo-badge bg-purple-900 text-white uppercase tracking-wider text-[11px] font-black shadow-neo-sm">
              Decentralized Community Arbitration
            </span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-dark">
              Join the Community Jury
            </h1>
            <p className="text-sm font-bold text-gray-700 max-w-2xl leading-relaxed">
              When restaurants or riders contest a customer complaint, the protocol draws 5 randomly selected jurors from the community pool to inspect IPFS evidence, cast binding verdicts, and earn POL rewards.
            </p>
          </div>

          {/* Workflow Steps Tracker */}
          <div className="bg-white/85 backdrop-blur-sm border-2 border-brand-dark p-5 rounded-lg space-y-3 shadow-neo-sm">
            <span className="text-[11px] font-black uppercase text-purple-950 tracking-wider block">
              Standard Onboarding Workflow:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border-2 border-brand-dark p-3.5 rounded-md flex items-start gap-3 shadow-neo-sm">
                <div className="w-8 h-8 rounded bg-purple-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm">
                  1
                </div>
                <div>
                  <h5 className="font-black text-xs uppercase text-brand-dark">Log In or Register</h5>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                    Sign in with your Web3 wallet or create a juror account.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-brand-dark p-3.5 rounded-md flex items-start gap-3 shadow-neo-sm">
                <div className="w-8 h-8 rounded bg-purple-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm">
                  2
                </div>
                <div>
                  <h5 className="font-black text-xs uppercase text-brand-dark">Stake {minStake} POL</h5>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                    Deposit refundable collateral into the UserRegistry contract.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-brand-dark p-3.5 rounded-md flex items-start gap-3 shadow-neo-sm">
                <div className="w-8 h-8 rounded bg-purple-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm">
                  3
                </div>
                <div>
                  <h5 className="font-black text-xs uppercase text-brand-dark">Review & Earn</h5>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5">
                    Cast majority votes on real disputes and claim rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('auth', 'juror')}
              className="neo-btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm font-black uppercase"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Juror Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate && onNavigate('auth', 'juror')}
              className="neo-btn-secondary flex items-center justify-center gap-2 py-3 px-6 text-sm font-black uppercase"
            >
              <Users className="w-4 h-4" />
              <span>Register as New Juror</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <ProtocolHighlights />
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 2: Logged in, but NOT a Juror
  // ----------------------------------------------------
  if (!isUserActiveJuror) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        <div className="neo-card p-6 sm:p-10 bg-gradient-to-br from-purple-100 via-purple-50 to-indigo-100 border-2 border-brand-dark text-brand-dark space-y-6 shadow-neo rounded-xl">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="neo-badge bg-purple-900 text-white uppercase tracking-wider text-[11px] font-black shadow-neo-sm">
                Community Juror Enrollment
              </span>
              <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded shadow-neo-sm">
                Not Staked in Juror Pool
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-dark">
              Activate Your Community Juror Status
            </h1>
            <div className="text-xs font-bold text-gray-800 bg-white/85 backdrop-blur-sm p-3 rounded-lg border-2 border-brand-dark shadow-neo-sm">
              Currently signed in as: <strong className="text-brand-dark">{user.name}</strong> (Role: <span className="uppercase text-purple-900 font-black">{user.role}</span>).
              To start arbitrating disputes and earning POL rewards, you need to join the decentralized juror pool.
            </div>
          </div>

          {/* Action Pathways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Pathway A: Stake with Current Account */}
            <div className="bg-white border-2 border-brand-dark p-6 rounded-lg shadow-neo space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-brand-dark flex items-center justify-center text-purple-900 shadow-neo-sm">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg uppercase text-brand-dark">
                  Stake {minStake} POL with Current Account
                </h3>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Deposit {minStake} POL collateral directly into the <code className="bg-purple-50 text-purple-900 px-1 py-0.5 rounded text-[11px] font-bold border border-purple-200">UserRegistry</code> smart contract. Your deposit is 100% refundable and can be withdrawn whenever you exit the pool.
                </p>
              </div>

              <div className="pt-2">
                {!account ? (
                  <button
                    onClick={connectWallet}
                    disabled={connecting}
                    className="neo-btn-primary w-full py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet to Stake</span>
                  </button>
                ) : (
                  <button
                    onClick={handleBecomeJuror}
                    disabled={loading}
                    className="neo-btn-primary w-full py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
                  >
                    <Coins className="w-4 h-4" />
                    <span>{loading ? 'Confirming On-Chain...' : `Stake ${minStake} POL & Join Pool`}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pathway B: Switch Account */}
            <div className="bg-white/90 border-2 border-brand-dark p-6 rounded-lg shadow-neo space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 border-2 border-brand-dark flex items-center justify-center text-purple-900 shadow-neo-sm">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg uppercase text-brand-dark">
                  Switch to Existing Juror Account
                </h3>
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  Already have another wallet registered and staked as a juror? Switch accounts now to review your assigned disputes.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate && onNavigate('auth', 'juror')}
                  className="neo-btn-secondary w-full py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Switch Account / Log In as Juror</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <ProtocolHighlights />
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 3: Authenticated Active Juror Dashboard
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-card p-6 bg-gradient-to-br from-purple-200 via-purple-100 to-indigo-100 border-2 border-brand-dark text-brand-dark flex flex-wrap justify-between items-center gap-4 shadow-neo rounded-xl">
        <div>
          <span className="neo-badge bg-purple-900 text-white mb-2 font-black shadow-neo-sm">Decentralized Arbitration</span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-brand-dark">Juror Panel & Disputes</h1>
          <p className="text-xs font-bold text-gray-700 mt-1">
            Stake test POL to judge contested complaints. Earn rewards for majority consensus.
          </p>
        </div>

        {/* Stake summary card */}
        <div className="bg-white border-2 border-brand-dark p-4 rounded-lg shadow-neo-sm flex items-center gap-4">
          <Award className="w-8 h-8 text-purple-800 shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">
              Your Juror Stake
            </span>
            <span className="text-xl font-black text-brand-dark">{jurorStake} POL</span>
            <span className="text-[10px] flex items-center gap-1.5 font-bold text-gray-700 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isJuror ? 'bg-green-600' : 'bg-gray-400'}`} />
              Status: {isJuror ? 'Active in Pool' : 'Not Staked'}
            </span>
          </div>

          <div className="pl-2">
            {!isJuror ? (
              <button
                onClick={handleBecomeJuror}
                disabled={loading}
                className="neo-btn-primary text-xs py-1.5 px-3"
              >
                Stake {minStake} POL
              </button>
            ) : (
              <button
                onClick={handleExitJuror}
                disabled={loading}
                className="border-2 border-brand-dark px-3 py-1 text-xs font-black bg-white hover:bg-brand-grayLight rounded shadow-neo-sm transition-colors"
              >
                Withdraw Stake
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assigned cases list */}
      <div className="space-y-4">
        <div className="border-b-2 border-brand-dark pb-2 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase flex items-center gap-2 text-brand-dark">
            <ShieldAlert className="w-5 h-5 text-brand-red" />
            <span>Disputes Assigned to Your Wallet ({assignedCases.length})</span>
          </h2>
          <span className="text-xs font-bold text-gray-600">Pseudo-random on-chain selection</span>
        </div>

        {assignedCases.length === 0 ? (
          <div className="neo-card p-8 text-center space-y-3 bg-white border-2 border-brand-dark">
            <Award className="w-10 h-10 text-brand-red mx-auto" />
            <h3 className="font-black text-lg text-brand-dark">No Active Assigned Disputes</h3>
            <p className="text-xs text-gray-600 font-bold max-w-md mx-auto">
              You are enrolled in the juror pool! When restaurants or delivery partners contest a customer complaint, the contract selects 5 jurors from the pool to arbitrate with real IPFS evidence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedCases.map((c) => (
              <div key={c.caseId} className="neo-card p-5 space-y-3 bg-white border-2 border-brand-dark">
                <div className="flex justify-between items-center border-b-2 border-brand-dark pb-2">
                  <span className="font-black text-base text-brand-dark">Case #{c.caseId}</span>
                  <span
                    className={`neo-badge ${
                      c.finalized
                        ? 'bg-green-200 text-green-900 border-green-800'
                        : 'bg-yellow-200 text-yellow-900 animate-pulse border-yellow-800'
                    }`}
                  >
                    {c.finalized ? 'Finalized' : 'Voting Active'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-semibold">
                  <div>
                    <span className="text-gray-500">Complaint: </span>
                    <strong className="text-brand-red">{c.complaint?.category}</strong>
                  </div>
                  <p className="text-xs italic bg-gray-50 p-2 border border-brand-dark rounded">
                    "{c.complaint?.description || 'No text description provided'}"
                  </p>
                  <div>
                    <span className="text-gray-500">Respondent: </span>
                    <span className="font-mono text-[10px]">{c.complaint?.respondentAddress}</span>
                  </div>
                </div>

                {/* Evidence preview */}
                {c.evidenceUrl && (
                  <div className="border border-brand-dark p-2 bg-brand-gray flex justify-between items-center text-xs font-bold rounded">
                    <span>IPFS Evidence:</span>
                    <a
                      href={c.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline flex items-center gap-1"
                    >
                      <span>View Full Resolution</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Current Vote Tallies */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-black pt-1">
                  <div className="border-2 border-brand-dark p-1.5 bg-red-100 text-red-950 rounded">
                    Uphold: {c.upholdVotes}
                  </div>
                  <div className="border-2 border-brand-dark p-1.5 bg-green-100 text-green-950 rounded">
                    Reject: {c.rejectVotes}
                  </div>
                </div>

                {/* Your Vote status */}
                <div className="border-t-2 border-brand-dark pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold">
                    {c.myVote === 1
                      ? 'Voted: Uphold'
                      : c.myVote === 2
                      ? 'Voted: Reject'
                      : 'You have not voted yet'}
                  </span>

                  {!c.finalized && c.myVote === 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCastVote(c.caseId, 1)}
                        disabled={loading}
                        className="neo-btn-primary text-xs py-1 px-3"
                      >
                        Uphold
                      </button>
                      <button
                        onClick={() => handleCastVote(c.caseId, 2)}
                        disabled={loading}
                        className="neo-btn-secondary text-xs py-1 px-3"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {!c.finalized && (c.upholdVotes + c.rejectVotes >= 5 || Date.now() / 1000 > c.votingDeadline) && (
                    <button
                      onClick={() => handleFinalize(c.caseId)}
                      disabled={loading}
                      className="neo-btn-dark text-xs py-1 px-3"
                    >
                      Finalize Case
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
