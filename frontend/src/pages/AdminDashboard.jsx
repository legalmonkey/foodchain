import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useWeb3 } from '../context/Web3Context';
import { StatusBadge } from '../components/StatusBadge';
import { Shield, Zap, Database, AlertTriangle, RefreshCw, Award } from 'lucide-react';

export const AdminDashboard = () => {
  const { account } = useWeb3();

  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

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
      setOrders(ordersRes.data);
      setComplaints(compRes.data);
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

  const handleForceFinalize = async (caseId, forcedVerdict) => {
    // 1 = Uphold, 2 = Reject
    try {
      await axios.post(`${API_URL}/api/admin/complaints/${caseId}/force-finalize`, { forcedVerdict });
      alert(`✓ Dispute Case #${caseId} force-finalized!`);
      fetchAdminData();
    } catch (err) {
      alert(`Could not force-finalize dispute: ${err.response?.data?.error || err.message}`);
    }
  };

  const orderStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-card p-6 bg-brand-yellow text-brand-dark flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="neo-badge bg-black text-white mb-2">⚡ God Mode Dashboard</span>
          <h1 className="text-3xl font-black uppercase">System Administration</h1>
          <p className="text-xs font-bold text-gray-800 mt-1">
            Manual controls for viva evaluations, dispute resolution emergency bypass, and database seeding.
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

      {/* Orders God-Mode Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">
          All Orders ({orders.length}) — State Override Controls
        </h2>

        <div className="neo-card bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-brand-muted font-black uppercase tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Restaurant</th>
                <th className="p-3">Total</th>
                <th className="p-3">Current Status</th>
                <th className="p-3">Force Status Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-yellow-50 font-semibold">
                  <td className="p-3 font-mono">#{o._id.slice(-6).toUpperCase()}</td>
                  <td className="p-3">{o.customerId?.name || 'Customer'}</td>
                  <td className="p-3 font-bold">{o.restaurantId?.name || 'Kitchen'}</td>
                  <td className="p-3 font-black">₹{o.totalPrice}</td>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaints & Disputes God-Mode */}
      <div className="space-y-4 pt-4 border-t-4 border-black">
        <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">
          All Grievance Complaints & Active Disputes ({complaints.length})
        </h2>

        <div className="neo-card bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-black bg-brand-muted font-black uppercase tracking-wider">
                <th className="p-3">Complaint #</th>
                <th className="p-3">Category</th>
                <th className="p-3">Respondent</th>
                <th className="p-3">Status</th>
                <th className="p-3">Evidence IPFS</th>
                <th className="p-3">Admin Finalize Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {complaints.map((c) => (
                <tr key={c._id} className="hover:bg-purple-50 font-semibold">
                  <td className="p-3 font-bold">#{c.onChainComplaintId || c._id.slice(-4)}</td>
                  <td className="p-3 font-black text-brand-red">{c.category}</td>
                  <td className="p-3 font-mono text-[10px] truncate max-w-[120px]">
                    {c.respondentAddress}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-[10px] bg-gray-100 border border-black px-1 py-0.5">
                      {c.evidenceCID?.slice(0, 10)}...
                    </span>
                  </td>
                  <td className="p-3">
                    {c.status === 'InDispute' && c.caseId ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleForceFinalize(c.caseId, 1)}
                          className="neo-btn-primary text-[10px] py-1 px-2"
                        >
                          Force Uphold
                        </button>
                        <button
                          onClick={() => handleForceFinalize(c.caseId, 2)}
                          className="neo-btn-secondary text-[10px] py-1 px-2"
                        >
                          Force Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-bold">
                        {c.status === 'Resolved' ? 'Resolved on-chain' : 'No active jury'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
