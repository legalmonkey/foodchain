import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { OrderCard } from '../components/OrderCard';
import { ComplaintCard } from '../components/ComplaintCard';
import { Bike, Award, CheckCircle } from 'lucide-react';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);

  useSocket({
    orderStatusChanged: (data) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === data.orderId ? { ...o, status: data.status, ...data.order } : o))
      );
    },
  });

  useEffect(() => {
    fetchOrdersAndComplaints();
  }, []);

  const fetchOrdersAndComplaints = async () => {
    try {
      const [ordersRes, compRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders/mine`),
        axios.get(`${API_URL}/api/complaints/mine`),
      ]);
      setOrders(ordersRes.data);
      setComplaints(compRes.data);
    } catch (err) {
      console.error('Error fetching delivery partner data:', err);
    }
  };

  const handleStatusAdvance = async (orderId, targetStatus) => {
    try {
      await axios.patch(`${API_URL}/api/orders/${orderId}/status`, { status: targetStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: targetStatus } : o))
      );
    } catch (err) {
      alert(`Could not advance delivery status: ${err.response?.data?.error || err.message}`);
    }
  };

  const activeDeliveries = orders.filter((o) => o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY');
  const pastDeliveries = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CLOSED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neo-card p-6 bg-brand-green text-black flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="neo-badge bg-black text-white mb-2">Delivery Partner</span>
          <h1 className="text-3xl font-black uppercase">{user?.name || 'Delivery Rider'}</h1>
          <p className="text-xs font-bold text-gray-800 mt-1">
            Wallet: {user?.walletAddress}
          </p>
        </div>

        <div className="bg-white text-brand-dark border-3 border-black p-4 shadow-neo flex items-center gap-3">
          <Award className="w-8 h-8 text-brand-green" />
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">
              Rider Reputation
            </span>
            <span className="text-2xl font-black">{user?.reputationScore || 70}/100</span>
          </div>
        </div>
      </div>

      {/* Active deliveries section */}
      <div className="space-y-4">
        <div className="border-b-2 border-black pb-2 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <Bike className="w-5 h-5 text-brand-dark" />
            <span>Active Deliveries ({activeDeliveries.length})</span>
          </h2>
          <span className="text-xs font-bold text-gray-600">Pick up orders & mark delivered</span>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="neo-card p-8 text-center space-y-2 bg-white">
            <Bike className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-black text-lg">No Deliveries in Transit</h3>
            <p className="text-xs text-gray-600 font-bold">
              When orders reach "PREPARING", they will appear here ready for pickup!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeDeliveries.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                userRole="delivery_partner"
                onStatusAdvance={handleStatusAdvance}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed deliveries & complaints */}
      <div className="space-y-4 pt-4 border-t-4 border-black">
        <h2 className="text-xl font-black uppercase">Delivered History ({pastDeliveries.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pastDeliveries.slice(0, 4).map((order) => (
            <OrderCard key={order._id} order={order} userRole="delivery_partner" />
          ))}
        </div>
      </div>
    </div>
  );
};
