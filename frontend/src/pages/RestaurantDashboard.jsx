import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import { useSocket } from '../hooks/useSocket';
import { OrderCard } from '../components/OrderCard';
import { ComplaintCard } from '../components/ComplaintCard';
import { Award, Plus, ChefHat, AlertOctagon, CheckCircle2, X, Utensils, Scale, ClipboardList, Trash2 } from 'lucide-react';

export const RestaurantDashboard = () => {
  const { user } = useAuth();
  const { account, connectWallet } = useWeb3();
  const complaintRegistryContract = useContract('ComplaintRegistry', true);

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'complaints' | 'menu'
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [myOwnRestaurant, setMyOwnRestaurant] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New menu item modal
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Burgers');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(true);

  useSocket({
    orderCreated: (newOrder) => {
      const activeRestId = String(restaurantProfile?._id || '');
      const incomingRestId = String(newOrder.restaurantId?._id || newOrder.restaurantId || '');
      if (incomingRestId === activeRestId) {
        setOrders((prev) => [newOrder, ...prev.filter((o) => String(o._id) !== String(newOrder._id))]);
      }
    },
    orderStatusChanged: (data) => {
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id) === String(data.orderId)
            ? { ...o, status: data.status, ...data.order }
            : o
        )
      );
    },
    complaintUpdated: () => {
      fetchComplaints();
    },
  });

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async (targetRestId = null) => {
    try {
      const [meRes, allRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`),
        axios.get(`${API_URL}/api/restaurants`).catch(() => ({ data: [] })),
      ]);

      const myRest = meRes.data.restaurant;
      if (myRest) {
        setMyOwnRestaurant(myRest);
      }

      const SEED_FALLBACKS = [
        { _id: 'res_truffles_01', name: 'Truffles Gourmet Burgers', cuisine: ['American', 'Burgers'], address: 'St. Marks Road, Central District' },
        { _id: 'res_meghana_02', name: 'Meghana Biryani House', cuisine: ['Biryani', 'Andhra'], address: 'Koramangala 5th Block, Tech Corridor' },
        { _id: 'res_napoli_03', name: 'Pizza Napoli Trattoria', cuisine: ['Italian', 'Pizza'], address: 'Indiranagar 100ft Road' },
        { _id: 'res_wok_04', name: 'Wok of Asia', cuisine: ['Pan-Asian', 'Chinese'], address: 'HSR Layout Sector 3' },
        { _id: 'res_subah_05', name: 'Subah South Tiffins', cuisine: ['South Indian', 'Breakfast'], address: 'Malleshwaram 7th Cross' },
      ];

      const mergedList = [...(allRes.data || [])];
      for (const fallback of SEED_FALLBACKS) {
        if (!mergedList.some((r) => String(r._id) === String(fallback._id))) {
          mergedList.push(fallback);
        }
      }
      setAllRestaurants(mergedList);

      // Determine active restaurant
      let activeRest = myRest;
      if (targetRestId) {
        const found = mergedList.find((r) => String(r._id) === String(targetRestId));
        if (found) activeRest = found;
      } else if (!activeRest && mergedList.length > 0) {
        activeRest = mergedList[0];
      }

      if (activeRest) {
        setRestaurantProfile({
          ...activeRest,
          reputationScore: activeRest.reputationScore || meRes.data.reputationScore || 70,
        });

        const restId = activeRest._id || 'my-restaurant';
        const [ordersRes, compRes, menuRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders/mine?restaurantId=${restId}`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/complaints/mine`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/restaurants/${restId}`).catch(() => ({ data: { menuItems: [] } })),
        ]);
        setOrders(ordersRes.data || []);
        setComplaints(compRes.data || []);
        setMenuItems(menuRes.data?.menuItems || []);
      }
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
    }
  };

  const handleSwitchRestaurant = async (targetId) => {
    await fetchProfileAndData(targetId);
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/mine`);
      setComplaints(res.data);
    } catch (err) {
      console.error('Error refreshing complaints:', err);
    }
  };

  const handleStatusAdvance = async (orderId, targetStatus) => {
    try {
      await axios.patch(`${API_URL}/api/orders/${orderId}/status`, { status: targetStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: targetStatus } : o))
      );
    } catch (err) {
      alert(`Could not advance order status: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleAcceptFault = async (onChainComplaintId) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setActionLoading(true);
    try {
      if (!complaintRegistryContract) throw new Error('Contract not connected');
      const tx = await complaintRegistryContract.respondentAccepts(onChainComplaintId);
      await tx.wait();
      alert(`✓ Fault accepted for Complaint #${onChainComplaintId}. Reputation updated on-chain.`);
      fetchComplaints();
      fetchProfileAndData();
    } catch (err) {
      alert(`Failed to accept fault on-chain: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContestComplaint = async (onChainComplaintId) => {
    if (!account) {
      await connectWallet();
      return;
    }
    setActionLoading(true);
    try {
      if (!complaintRegistryContract) throw new Error('Contract not connected');
      const tx = await complaintRegistryContract.respondentContests(onChainComplaintId);
      const receipt = await tx.wait();
      alert(`✓ Complaint #${onChainComplaintId} contested! Dispute escalated to Decentralized Jury.`);
      fetchComplaints();
    } catch (err) {
      alert(`Failed to contest complaint on-chain: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      const restId = restaurantProfile?._id || 'my-restaurant';
      await axios.post(`${API_URL}/api/restaurants/${restId}/menu`, {
        name: newItemName,
        price: Number(newItemPrice),
        category: newItemCategory,
        description: newItemDesc,
        isVeg: newItemVeg,
      });
      setShowAddMenuModal(false);
      const addedDish = newItemName;
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      await fetchProfileAndData(restaurantProfile?._id);
      alert(`✓ "${addedDish}" added successfully to ${restaurantProfile?.name || 'the menu'}!`);
    } catch (err) {
      alert(`Failed to add dish: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteMenuItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}" from the menu?`)) {
      return;
    }

    try {
      const restId = restaurantProfile?._id || 'my-restaurant';
      await axios.delete(`${API_URL}/api/restaurants/${restId}/menu/${itemId}`);
      setMenuItems((prev) => prev.filter((m) => String(m._id) !== String(itemId)));
      alert(`✓ "${itemName}" has been deleted from the menu.`);
    } catch (err) {
      alert(`Failed to delete dish: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Restaurant Header */}
      <div className="neo-card p-6 bg-brand-red text-white flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="neo-badge bg-white text-black">Kitchen Dashboard</span>
            {allRestaurants.length > 0 && (
              <div className="flex items-center gap-1.5 bg-black/40 border-2 border-white/40 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                <span className="text-white/80">Active Kitchen:</span>
                <select
                  value={restaurantProfile?._id || ''}
                  onChange={(e) => handleSwitchRestaurant(e.target.value)}
                  className="bg-white text-brand-dark font-black text-xs px-2.5 py-1 rounded border-2 border-black focus:outline-none cursor-pointer hover:bg-yellow-100 transition-colors"
                >
                  {myOwnRestaurant && (
                    <option value={String(myOwnRestaurant._id)}>
                      ★ {myOwnRestaurant.name} (My Registered Kitchen)
                    </option>
                  )}
                  {allRestaurants
                    .filter((r) => String(r._id) !== String(myOwnRestaurant?._id))
                    .map((r) => (
                      <option key={String(r._id)} value={String(r._id)}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black uppercase">
            {restaurantProfile?.name || 'Restaurant Kitchen'}
          </h1>
          <p className="text-xs text-red-100 font-semibold mt-1">
            {restaurantProfile?.cuisine?.join(' • ')} • {restaurantProfile?.address}
          </p>
        </div>

        <div className="bg-white text-brand-dark border-3 border-black p-4 shadow-neo flex items-center gap-3">
          <Award className="w-8 h-8 text-brand-red" />
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block">
              On-Chain Reputation
            </span>
            <span className="text-2xl font-black">{restaurantProfile?.reputationScore || 70}/100</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-4 border-black gap-2">
        {[
          { id: 'orders', label: `Live Kitchen Queue (${orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CLOSED').length})`, icon: Utensils },
          { id: 'complaints', label: `Complaints Inbox (${complaints.length})`, icon: Scale },
          { id: 'menu', label: `Menu Management (${menuItems.length})`, icon: ClipboardList },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-black text-xs sm:text-sm py-3 px-4 sm:px-6 border-t-3 border-x-3 border-black transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-yellow -mb-1 pb-4 shadow-neo-sm text-brand-dark'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KITCHEN ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase">Incoming & Active Orders</h2>
            <span className="text-xs font-bold text-gray-600">Advance states with 1 click</span>
          </div>

          {orders.length === 0 ? (
            <div className="neo-card p-8 text-center space-y-2 bg-white">
              <ChefHat className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="font-black text-lg">No Orders in Queue</h3>
              <p className="text-xs text-gray-600 font-bold">
                Orders placed by customers will arrive here automatically via Socket.io!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  userRole="restaurant"
                  onStatusAdvance={handleStatusAdvance}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLAINTS INBOX */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase">Grievance Resolutions</h2>
            <span className="text-xs font-bold text-gray-600">Accept Fault or Contest to Jury</span>
          </div>

          {complaints.length === 0 ? (
            <div className="neo-card p-8 text-center space-y-2 bg-white">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <h3 className="font-black text-lg">Clean Record</h3>
              <p className="text-xs text-gray-600 font-bold">
                No active complaints filed against this kitchen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complaints.map((complaint) => (
                <ComplaintCard
                  key={complaint._id || complaint.onChainComplaintId}
                  complaint={complaint}
                  currentUserWallet={user?.walletAddress}
                  onAcceptFault={handleAcceptFault}
                  onContestComplaint={handleContestComplaint}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase">Catalog Dishes</h2>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="neo-btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div key={item._id} className="neo-card p-4 space-y-3 bg-white flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 border border-black shrink-0 ${
                          item.isVeg ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <h4 className="font-black text-sm">{item.name}</h4>
                    </div>
                    <span className="neo-badge bg-brand-muted shrink-0">{item.category}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                </div>
                <div className="border-t border-black pt-2 flex justify-between items-center font-black text-sm">
                  <span>₹{item.price}</span>
                  <button
                    onClick={() => handleDeleteMenuItem(item._id, item.name)}
                    className="px-2.5 py-1 text-xs font-black text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded flex items-center gap-1 transition-all active:translate-y-0.5"
                    title={`Delete ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD MENU ITEM MODAL */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="neo-card bg-white w-full max-w-md overflow-hidden space-y-4">
            <div className="border-b-3 border-black p-4 bg-brand-yellow flex justify-between items-center">
              <h3 className="font-black text-base uppercase">Add Menu Dish</h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="border-2 border-black p-1 bg-white text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMenuItem} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Smoky Barbecue Wings"
                  className="neo-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="250"
                    className="neo-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="neo-input w-full"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Mains">Mains</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Ingredients and culinary style..."
                  className="neo-input w-full"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vegCheck"
                  checked={newItemVeg}
                  onChange={(e) => setNewItemVeg(e.target.checked)}
                  className="w-4 h-4 border-2 border-black"
                />
                <label htmlFor="vegCheck" className="text-xs font-bold">
                  Vegetarian Dish
                </label>
              </div>

              <button
                type="submit"
                className="neo-btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider mt-2"
              >
                Save Dish to Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
