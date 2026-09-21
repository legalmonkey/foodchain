import React from 'react';
import { StatusBadge } from './StatusBadge';
import { PINATA_GATEWAY_URL, BLOCK_EXPLORER_URL } from '../config';
import { ShieldAlert, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

export const ComplaintCard = ({
  complaint,
  currentUserWallet,
  onAcceptFault,
  onContestComplaint,
  actionLoading,
}) => {
  const isRespondent =
    currentUserWallet &&
    complaint.respondentAddress?.toLowerCase() === currentUserWallet.toLowerCase();

  const evidenceUrl = complaint.evidenceCID
    ? `${PINATA_GATEWAY_URL}/${complaint.evidenceCID}`
    : null;

  return (
    <div className="neo-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-brand-red" />
          <h3 className="font-black text-base">
            Complaint #{complaint.onChainComplaintId || complaint._id?.slice(-4)} —{' '}
            <span className="text-brand-red">{complaint.category}</span>
          </h3>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      {/* Description */}
      {complaint.description && (
        <p className="text-xs bg-gray-50 border border-black p-2.5 font-medium">
          "{complaint.description}"
        </p>
      )}

      {/* Media Evidence Viewer */}
      {evidenceUrl && (
        <div className="border-2 border-black p-2 bg-brand-muted space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span>📷 Pinned IPFS Evidence:</span>
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-700 underline"
            >
              <span>{complaint.evidenceCID.slice(0, 12)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="max-h-48 overflow-hidden flex justify-center bg-black/5 border border-black">
            <img
              src={evidenceUrl}
              alt="Complaint Evidence"
              className="object-contain max-h-48 hover:scale-105 transition-all"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Addresses */}
      <div className="text-[11px] font-mono space-y-1 text-gray-700 bg-white border border-black p-2">
        <div>Filer: <span className="font-bold">{complaint.filerAddress}</span></div>
        <div>Respondent: <span className="font-bold">{complaint.respondentAddress}</span></div>
      </div>

      {/* Respondent Action Buttons */}
      {isRespondent && complaint.status === 'Filed' && (
        <div className="pt-2 border-t-2 border-black flex flex-wrap gap-2">
          <button
            onClick={() => onAcceptFault(complaint.onChainComplaintId)}
            disabled={actionLoading}
            className="neo-btn bg-red-100 hover:bg-red-200 text-red-950 text-xs flex items-center gap-1 py-1.5 px-3"
          >
            <CheckCircle2 className="w-4 h-4 text-red-700" />
            <span>Accept Fault (-10 Rep)</span>
          </button>

          <button
            onClick={() => onContestComplaint(complaint.onChainComplaintId)}
            disabled={actionLoading}
            className="neo-btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
          >
            <XCircle className="w-4 h-4 text-brand-dark" />
            <span>Contest & Escalate to Jury</span>
          </button>
        </div>
      )}

      {/* Resolution status info */}
      {complaint.status === 'Resolved' && (
        <div className={`p-2.5 border-2 border-black text-xs font-bold ${
          complaint.verdictUpheld ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
        }`}>
          {complaint.verdictUpheld
            ? '⚠️ Verdict: Complaint UPHELD against respondent by Jury Consensus (-10 Rep)'
            : '✅ Verdict: Complaint DISMISSED in favor of respondent (+2 Rep)'}
        </div>
      )}
    </div>
  );
};
