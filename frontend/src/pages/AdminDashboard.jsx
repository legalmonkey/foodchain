import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, PINATA_GATEWAY_URL } from '../config';
import { useWeb3 } from '../context/Web3Context';
import { StatusBadge } from '../components/StatusBadge';
import { Shield, Zap, Database, AlertTriangle, RefreshCw, Award, DollarSign, RotateCcw, ExternalLink, CheckCircle2, Lock } from 'lucide-react';

export const AdminDashboard = () => {
  const { account } = useWeb3();

  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [ordersRes, compRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/orders`),
        axios.get(`${API_URL}/api/admin/complaints`),
      ]);
      setOrders(ordersRes.data || []);
      setComplaints(compRes.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API_URL}/api/admin/orders/${orderId}/force-status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
    } catch (err) {
      alert(`Could not force status: ${err.message}`);
    }
  };

  const handleDispatchEscrow = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      const res = await axios.post(`${API_URL}/api/admin/orders/${orderId}/dispatch-escrow`);
      alert(`✓ ${res.data.message}`);
      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(orderId) ? { ...o, escrow: res.data.escrow } : o))
      );
    } catch (err) {
      alert(`Escrow dispatch failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefundEscrow = async (orderId) => {
    if (!window.confirm("Refund full order amount from escrow back to customer?")) return;
    setActionLoadingId(orderId);
    try {
      const res = await axios.post(`${API_URL}/api/admin/orders/${orderId}/refund-escrow`);
      alert(`✓ ${res.data.message}`);
      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(orderId) ? { ...o, escrow: res.data.escrow } : o))
      );
    } catch (err) {
      alert(`Escrow refund failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClawbackOrder = async (orderId) => {
    if (!window.confirm("Formally order the restaurant to pay back the dispatched funds for this order?")) return;
    setActionLoadingId(orderId);
    try {
      const res = await axios.post(`${API_URL}/api/admin/orders/${orderId}/clawback-order`);
      alert(`✓ ${res.data.message}`);
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id) === String(orderId)
            ? { ...o, escrow: res.data.order?.escrow || { ...o.escrow, clawbackRequested: true } }
            : o
        )
      );
    } catch (err) {
      alert(`Clawback demand failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleForceFinalize = async (caseId, forcedVerdict) => {
    // 1 = Uphold (Customer Wins), 2 = Reject
    try {
      const res = await axios.post(`${API_URL}/api/admin/complaints/${caseId}/force-finalize`, { forcedVerdict });
      alert(`✓ ${res.data.message}`);
      fetchAdminData();
    } catch (err) {
      alert(`Could not force-finalize dispute: ${err.response?.data?.error || err.message}`);
    }
  };

  const orderStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-card p-6 bg-brand-dark text-white flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="neo-badge bg-brand-red text-white mb-2">Platform Operations Console</span>
          <h1 className="text-3xl font-black uppercase tracking-tight">System Administration</h1>
          <p className="text-xs font-semibold text-gray-300 mt-1">
            Manual controls for evaluations, dispute resolution emergency bypass, and state overrides.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="neo-btn bg-white hover:bg-gray-100 text-xs flex items-center gap-1 py-2 px-3"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Orders Administration Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
          <h2 className="text-xl font-black uppercase">
            All Platform Orders ({orders.length}) — Escrow & Lifecycle Controls
          </h2>
          <span className="text-xs font-bold text-gray-600">
            Escrow locks funds on order placement. Dispatch upon delivery, or refund if dispute upheld.
          </span>
        </div>

        <div className="neo-card bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-brand-muted font-black uppercase tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Restaurant</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Admin Escrow Vault</th>
                <th className="p-3">Escrow Settlement Actions</th>
                <th className="p-3">Force Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500 font-bold">
                    No orders registered in platform database yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const escrowStatus = o.escrow?.status || (o.status === 'DELIVERED' || o.status === 'CLOSED' ? 'DISPATCHED' : 'HELD_BY_ADMIN');
                  const restAmt = o.escrow?.restaurantAmount || Math.round((o.totalPrice || 200) * 0.8);
                  const riderAmt = o.escrow?.riderAmount || Math.round((o.totalPrice || 200) * 0.15);
                  const isDelivered = o.status === 'DELIVERED' || o.status === 'CLOSED';
                  const orderComplaint = complaints.find((c) => {
                    const cOrderId = String(c.orderId?._id || c.orderId || '');
                    return cOrderId === String(o._id) || (o.onChainOrderKey && c.orderKey === o.onChainOrderKey);
                  });
                  const hasDispute = Boolean(orderComplaint || o.hasDispute);
                  const clawbackRequested = Boolean(o.escrow?.clawbackRequested);

                  return (
                    <tr key={o._id} className="hover:bg-yellow-50 font-semibold">
                      <td className="p-3 font-mono">#{o._id.slice(-6).toUpperCase()}</td>
                      <td className="p-3">{o.customerId?.name || 'Customer'}</td>
                      <td className="p-3 font-bold">{o.restaurantId?.name || 'Kitchen'}</td>
                      <td className="p-3 font-black">₹{o.totalPrice}</td>
                      <td className="p-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="p-3">
                        {escrowStatus === 'DISPATCHED' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-green-100 text-green-900 border border-green-400 rounded">
                              <CheckCircle2 className="w-3 h-3 text-green-700" />
                              <span>Settled & Dispatched</span>
                            </span>
                            <div className="text-[10px] font-bold text-gray-600">
                              ₹{restAmt} Kitchen • ₹{riderAmt} Rider
                            </div>
                          </div>
                        ) : escrowStatus === 'REFUNDED' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-400 rounded">
                              <RotateCcw className="w-3 h-3 text-purple-700" />
                              <span>Refunded to Customer</span>
                            </span>
                            <div className="text-[10px] font-bold text-gray-600">
                              ₹{o.totalPrice} Returned in Full
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-yellow-100 text-yellow-900 border border-yellow-400 rounded animate-pulse">
                              <Lock className="w-3 h-3 text-yellow-700" />
                              <span>Locked in Admin Escrow</span>
                            </span>
                            <div className="text-[10px] font-bold text-gray-600">
                              ₹{o.totalPrice} held awaiting delivery
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {escrowStatus === 'DISPATCHED' ? (
                            clawbackRequested ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-400 rounded">
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                  <span>Restaurant Ordered to Pay Back</span>
                                </span>
                                {hasDispute && (
                                  <button
                                    onClick={() => handleRefundEscrow(o._id)}
                                    disabled={actionLoadingId === o._id}
                                    className="neo-btn bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-400 text-[10px] font-black py-0.5 px-1.5 flex items-center gap-1"
                                    title="Dispute upheld: return funds to customer"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>Force Refund to Customer</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleClawbackOrder(o._id)}
                                disabled={actionLoadingId === o._id}
                                className="neo-btn bg-amber-300 hover:bg-amber-400 text-brand-dark border-2 border-brand-dark text-[11px] font-black py-1 px-2.5 flex items-center gap-1 shadow-neo-sm"
                                title="Dispatched: Order restaurant to pay the money back"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-black" />
                                <span>Order restaurant to pay the money back</span>
                              </button>
                            )
                          ) : escrowStatus === 'REFUNDED' ? (
                            <span className="text-[11px] font-black text-purple-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Refunded to Customer</span>
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleDispatchEscrow(o._id)}
                                disabled={actionLoadingId === o._id}
                                className={`neo-btn text-[11px] font-black py-1 px-2.5 flex items-center gap-1 ${
                                  isDelivered
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-neo-sm'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                }`}
                                title={`Dispatch ₹${restAmt} to Kitchen and ₹${riderAmt} to Rider`}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Dispatch Money</span>
                              </button>

                              {/* Return money is an option ONLY when dispute */}
                              {hasDispute && (
                                <button
                                  onClick={() => handleRefundEscrow(o._id)}
                                  disabled={actionLoadingId === o._id}
                                  className="neo-btn bg-red-100 hover:bg-red-200 text-red-900 border border-red-400 text-[11px] font-black py-1 px-2 flex items-center gap-1"
                                  title="Active grievance dispute found: Return full order payment back to customer"
                                >
                                  <RotateCcw className="w-3 h-3 text-red-700" />
                                  <span>Return Money (Dispute)</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {orderStatuses.map((st) => (
                            <button
                              key={st}
                              onClick={() => handleForceStatus(o._id, st)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 border border-black ${
                                o.status === st
                                  ? 'bg-black text-white font-black'
                                  : 'bg-white hover:bg-brand-yellow'
                              }`}
                            >
                              {st.slice(0, 4)}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaints & Disputes Governance */}
      <div className="space-y-4 pt-4 border-t-4 border-black">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
          <h2 className="text-xl font-black uppercase">
            All Grievance Complaints & Active Disputes ({complaints.length})
          </h2>
          <span className="text-xs font-bold text-gray-600">
            Dispute cases trigger automatic refund on customer victory.
          </span>
        </div>

        <div className="neo-card bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-brand-muted font-black uppercase tracking-wider">
                <th className="p-3">Complaint #</th>
                <th className="p-3">Category</th>
                <th className="p-3">Respondent</th>
                <th className="p-3">Status</th>
                <th className="p-3">Evidence IPFS</th>
                <th className="p-3">Admin Redressal Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500 font-bold">
                    No complaints registered in platform records yet.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const ipfsUrl = c.evidenceCID
                    ? `${PINATA_GATEWAY_URL}/${c.evidenceCID}`
                    : null;
                  const fallbackApiUrl = c.evidenceCID
                    ? `${API_URL}/api/complaints/evidence/${c.evidenceCID}`
                    : null;

                  return (
                    <tr key={c._id || c.onChainComplaintId} className="hover:bg-purple-50 font-semibold">
                      <td className="p-3 font-bold">#{c.onChainComplaintId || c._id?.slice(-4)}</td>
                      <td className="p-3 font-black text-brand-red">{c.category}</td>
                      <td className="p-3 font-mono text-[10px] truncate max-w-[120px]">
                        {c.respondentAddress}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-3">
                        {c.evidenceCID ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={ipfsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[10px] bg-gray-100 border border-black px-1.5 py-0.5 hover:bg-yellow-200 text-blue-700 flex items-center gap-1"
                              title="View IPFS Evidence on Pinata Gateway"
                            >
                              <span>{c.evidenceCID.slice(0, 10)}...</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {c.status === 'InDispute' && c.caseId ? (
                            <>
                              <button
                                onClick={() => handleForceFinalize(c.caseId, 1)}
                                className="neo-btn bg-green-600 hover:bg-green-700 text-white text-[10px] font-black py-1 px-2.5 shadow-neo-sm"
                                title="Uphold Complaint: Customer wins & escrow is refunded"
                              >
                                Uphold (Refund Customer)
                              </button>
                              <button
                                onClick={() => handleForceFinalize(c.caseId, 2)}
                                className="neo-btn bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-1 px-2"
                                title="Reject Complaint: Respondent exonerated"
                              >
                                Reject
                              </button>
                            </>
                          ) : c.status === 'Resolved' || c.status === 'AutoResolved' ? (
                            <span className="text-[11px] font-black text-green-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{c.verdictUpheld ? 'Customer Won (Refund Issued)' : 'Exonerated'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-bold">
                              Awaiting Kitchen response
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
