import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { API_URL, PINATA_GATEWAY_URL, BLOCK_EXPLORER_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import { useSocket } from '../hooks/useSocket';
import { Scale, Award, ShieldAlert, CheckCircle2, XCircle, Clock, ExternalLink, ArrowRight } from 'lucide-react';

export const JurorDashboard = () => {
  const { user } = useAuth();
  const { account, signer, connectWallet } = useWeb3();

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

  useEffect(() => {
    if (account) {
      checkJurorStatus();
      fetchAssignedCases();
    }
  }, [account]);

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
      if (!userRegistryContract) throw new Error('Contract not connected');
      const stakeValue = ethers.parseEther(minStake || '0.01');
      const tx = await userRegistryContract.becomeJuror({ value: stakeValue });
      await tx.wait();

      await axios.post(`${API_URL}/api/juror/register`);
      alert(`✓ Successfully joined Juror Pool with ${minStake} POL staked!`);
      checkJurorStatus();
    } catch (err) {
      alert(`Failed to stake as juror: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExitJuror = async () => {
    setLoading(true);
    try {
      if (!userRegistryContract) throw new Error('Contract not connected');
      const tx = await userRegistryContract.exitJuror();
      await tx.wait();
      alert('✓ Stake withdrawn and exited from Juror Pool.');
      checkJurorStatus();
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
      if (!disputeResolutionContract) throw new Error('DisputeResolution contract not connected');
      const tx = await disputeResolutionContract.castVote(caseId, verdict);
      await tx.wait();

      await axios.post(`${API_URL}/api/juror/cases/${caseId}/vote`, {
        verdict: verdict === 1 ? 'UpholdComplaint' : 'RejectComplaint',
        verdictIndex: verdict,
      });

      alert(`✓ Vote recorded on-chain for Case #${caseId}!`);
      fetchAssignedCases();
      setSelectedCase(null);
    } catch (err) {
      alert(`Failed to cast vote: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async (caseId) => {
    setLoading(true);
    try {
      if (!disputeResolutionContract) throw new Error('Contract not connected');
      const tx = await disputeResolutionContract.finalizeCase(caseId);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-card p-6 bg-purple-200 border-4 border-black text-brand-dark flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="neo-badge bg-black text-white mb-2">Decentralized Arbitration</span>
          <h1 className="text-3xl font-black uppercase">Juror Panel & Disputes</h1>
          <p className="text-xs font-bold text-gray-800 mt-1">
            Stake test POL to judge contested complaints. Earn rewards for majority consensus.
          </p>
        </div>

        {/* Stake summary card */}
        <div className="bg-white border-3 border-black p-4 shadow-neo flex items-center gap-4">
          <Scale className="w-8 h-8 text-purple-700" />
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">
              Your Juror Stake
            </span>
            <span className="text-xl font-black">{jurorStake} POL</span>
            <span className="text-[10px] block font-bold text-gray-600">
              Status: {isJuror ? '🟢 Active in Pool' : '⚪ Not Staked'}
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
                className="border-2 border-black px-2 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200"
              >
                Withdraw Stake
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assigned cases list */}
      <div className="space-y-4">
        <div className="border-b-2 border-black pb-2 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-red" />
            <span>Disputes Assigned to Your Wallet ({assignedCases.length})</span>
          </h2>
          <span className="text-xs font-bold text-gray-600">Pseudo-random on-chain selection</span>
        </div>

        {assignedCases.length === 0 ? (
          <div className="neo-card p-8 text-center space-y-3 bg-white">
            <span className="text-4xl">⚖️</span>
            <h3 className="font-black text-lg">No Active Assigned Disputes</h3>
            <p className="text-xs text-gray-600 font-bold max-w-md mx-auto">
              When restaurants or delivery partners contest a customer complaint, the contract selects 5 jurors from the pool to arbitrate with real IPFS evidence!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedCases.map((c) => (
              <div key={c.caseId} className="neo-card p-5 space-y-3 bg-white">
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="font-black text-base">Case #{c.caseId}</span>
                  <span
                    className={`neo-badge ${
                      c.finalized
                        ? 'bg-green-200 text-green-900'
                        : 'bg-yellow-200 text-yellow-900 animate-pulse'
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
                  <p className="text-xs italic bg-gray-50 p-2 border border-black">
                    "{c.complaint?.description || 'No text description provided'}"
                  </p>
                  <div>
                    <span className="text-gray-500">Respondent: </span>
                    <span className="font-mono text-[10px]">{c.complaint?.respondentAddress}</span>
                  </div>
                </div>

                {/* Evidence preview */}
                {c.evidenceUrl && (
                  <div className="border border-black p-2 bg-brand-muted flex justify-between items-center text-xs font-bold">
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
                  <div className="border-2 border-black p-1.5 bg-red-100 text-red-950">
                    Uphold: {c.upholdVotes}
                  </div>
                  <div className="border-2 border-black p-1.5 bg-green-100 text-green-950">
                    Reject: {c.rejectVotes}
                  </div>
                </div>

                {/* Your Vote status */}
                <div className="border-t-2 border-black pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold">
                    {c.myVote === 1
                      ? '🗳️ Voted: Uphold'
                      : c.myVote === 2
                      ? '🗳️ Voted: Reject'
                      : '⏳ You have not voted yet'}
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
