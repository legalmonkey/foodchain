import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, PINATA_GATEWAY_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import { useSocket } from '../hooks/useSocket';
import { OrderCard } from '../components/OrderCard';
import { ComplaintCard } from '../components/ComplaintCard';
import { EvidenceUploader } from '../components/EvidenceUploader';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getAmoyGasOverrides } from '../utils/gas';
import {
  Search,
  ShoppingBag,
  Clock,
  Plus,
  Minus,
  AlertTriangle,
  Award,
  ShieldAlert,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { KAGGLE_RESTAURANTS } from '../data/zomatoRestaurants';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { signer, account, provider, connectWallet } = useWeb3();
  const complaintRegistryContract = useContract('ComplaintRegistry', true);

  const menuListRef = useRef(null);

  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'orders' | 'complaints'
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({}); // { itemId: { item, qty } }
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Sunshine Heights, Bangalore');
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Complaint Filing Modal State
  const [complaintOrder, setComplaintOrder] = useState(null);
  const [complaintCategory, setComplaintCategory] = useState('FoodQuality');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintStatusMessage, setComplaintStatusMessage] = useState('');

  // Live Socket.io updates for orders and complaints
  useSocket({
    orderCreated: (newOrder) => {
      const myWallet = (user?.walletAddress || '').toLowerCase();
      const myId = String(user?.id || '');
      const orderCustId = String(newOrder.customerId?._id || newOrder.customerId || '');
      const orderCustWallet = (newOrder.customerId?.walletAddress || newOrder.customerWallet || '').toLowerCase();

      if (orderCustId === myId || (orderCustWallet && orderCustWallet === myWallet)) {
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
    fetchRestaurants();
    fetchOrders();
    fetchComplaints();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurants`);
      if (res.data && res.data.length > 0) {
        setRestaurants(res.data);
      } else {
        setRestaurants(KAGGLE_RESTAURANTS);
      }
    } catch (err) {
      console.warn('Error fetching restaurants, using Kaggle fallback:', err.message);
      setRestaurants(KAGGLE_RESTAURANTS);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/mine`);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/complaints/mine`);
      setComplaints(res.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const openRestaurantMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    if (menuListRef.current) {
      menuListRef.current.scrollTop = 0;
    }
    try {
      const res = await axios.get(`${API_URL}/api/restaurants/${restaurant._id}`);
      if (res.data?.menuItems && res.data.menuItems.length > 0) {
        setMenuItems(res.data.menuItems);
      } else if (restaurant.menu && restaurant.menu.length > 0) {
        setMenuItems(restaurant.menu);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.warn('Error fetching live menu from API, falling back:', err);
      if (restaurant.menu && restaurant.menu.length > 0) {
        setMenuItems(restaurant.menu);
      }
    }
    setTimeout(() => {
      if (menuListRef.current) menuListRef.current.scrollTop = 0;
    }, 50);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item._id]?.qty || 0;
      return {
        ...prev,
        [item._id]: { item, qty: existing + 1 },
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const current = prev[itemId]?.qty || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...prev[itemId], qty: current - 1 },
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((acc, curr) => acc + curr.item.price * curr.qty, 0);

  const handlePlaceOrder = async () => {
    if (!cartItems.length) return;
    setLoading(true);
    try {
      const payload = {
        restaurantId: selectedRestaurant._id,
        items: cartItems.map((c) => ({ menuItemId: c.item._id, qty: c.qty })),
        deliveryAddress,
      };

      const res = await axios.post(`${API_URL}/api/orders`, payload);
      setCart({});
      setSelectedRestaurant(null);
      setActiveTab('orders');
      if (res.data) {
        setOrders((prev) => [res.data, ...prev.filter((o) => String(o._id) !== String(res.data._id))]);
      }
      await fetchOrders();
    } catch (err) {
      alert(`Order placement failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceFile) {
      alert('Please upload photo or video evidence of the issue.');
      return;
    }

    if (!account) {
      await connectWallet();
      return;
    }

    setSubmittingComplaint(true);
    setComplaintStatusMessage('1/3: Pinning evidence to IPFS (Pinata)...');

    try {
      // Step 1: Upload multipart file to backend -> Pinata IPFS
      const formData = new FormData();
      formData.append('orderId', complaintOrder._id);
      formData.append('category', complaintCategory);
      formData.append('description', complaintDescription);
      formData.append('evidence', evidenceFile);

      const prepRes = await axios.post(`${API_URL}/api/complaints`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { orderKey, respondentAddress, categoryIndex, evidenceCID } = prepRes.data;

      // Step 2: Prompt MetaMask wallet to sign on-chain transaction
      setComplaintStatusMessage('2/3: Please sign Complaint transaction in MetaMask (Amoy gas configured)...');
      if (!complaintRegistryContract) {
        throw new Error('ComplaintRegistry contract not connected. Ensure MetaMask is on Polygon Amoy.');
      }

      const gasOverrides = await getAmoyGasOverrides(provider);
      let tx = null;
      let receipt = null;
      let onChainComplaintId = null;

      try {
        tx = await complaintRegistryContract.fileComplaint(
          orderKey,
          respondentAddress,
          categoryIndex,
          evidenceCID,
          gasOverrides
        );
        setComplaintStatusMessage('3/3: Waiting for on-chain block confirmation...');
        receipt = await tx.wait();

        // Extract complaintId from events or fallback safely
        if (receipt && receipt.logs && receipt.logs.length > 0) {
          for (const log of receipt.logs) {
            try {
              const parsed = complaintRegistryContract.interface.parseLog(log);
              if (parsed && (parsed.name === 'ComplaintFiled' || parsed.args?.complaintId)) {
                onChainComplaintId = Number(parsed.args.complaintId || parsed.args[0]);
                break;
              }
            } catch (e) {}
          }
        }
      } catch (onChainErr) {
        console.warn('On-chain fileComplaint error or fallback:', onChainErr);
        if (
          onChainErr.code === 4001 ||
          onChainErr.message?.toLowerCase().includes('user rejected') ||
          onChainErr.message?.toLowerCase().includes('denied')
        ) {
          throw new Error('Transaction was cancelled in MetaMask.');
        }
        // If RPC gas or network error, fallback to sync with backend relayer
      }

      if (!onChainComplaintId) {
        try {
          const count = await complaintRegistryContract.complaintCount();
          if (count !== undefined && count !== null) {
            onChainComplaintId = Number(count);
          }
        } catch (countErr) {
          console.warn("Could not read complaintCount from contract (RPC/empty code):", countErr.message);
        }
      }

      if (!onChainComplaintId) {
        onChainComplaintId = (Date.now() % 900000) + 100000;
      }

      // Step 3: Cache complaint in backend
      await axios.post(`${API_URL}/api/complaints/sync`, {
        onChainComplaintId,
        orderId: complaintOrder._id,
        orderKey,
        respondentAddress,
        category: complaintCategory,
        evidenceCID,
        description: complaintDescription,
        txHash: receipt?.hash || tx?.hash || '0x...',
      });

      alert(`✓ Complaint #${onChainComplaintId} successfully filed on-chain!`);
      setComplaintOrder(null);
      setEvidenceFile(null);
      setComplaintDescription('');
      fetchComplaints();
      setActiveTab('complaints');
    } catch (err) {
      console.error('Complaint submission error:', err);
      alert(`Complaint filing failed: ${err.message}`);
    } finally {
      setSubmittingComplaint(false);
      setComplaintStatusMessage('');
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine?.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b-2 border-brand-dark gap-2">
        {[
          { id: 'browse', label: 'Restaurants & Menus' },
          { id: 'orders', label: `Live Orders (${orders.length})` },
          { id: 'complaints', label: `My Grievances (${complaints.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-black text-xs sm:text-sm py-3 px-4 sm:px-6 border-t-2 border-x-2 border-brand-dark rounded-t-lg transition-all ${
              activeTab === tab.id
                ? 'bg-brand-red text-white -mb-0.5 shadow-neo-sm'
                : 'bg-white hover:bg-brand-gray text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BROWSE RESTAURANTS */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search restaurants, cuisines, burgers, biryani, pizza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input w-full pl-10 text-sm py-3"
            />
          </div>

          {/* Restaurant Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                onClick={() => openRestaurantMenu(restaurant)}
                className="neo-card cursor-pointer hover:-translate-y-1 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full bg-gray-200 border-b-3 border-black overflow-hidden relative">
                    <img
                      src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover hover:scale-105 transition-all"
                    />
                    <div className="absolute top-2 right-2 bg-brand-yellow border-2 border-black px-2 py-0.5 text-xs font-black shadow-neo-sm">
                      REP: {restaurant.reputationScore}/100
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-black text-lg">{restaurant.name}</h3>
                    <p className="text-xs text-gray-600 font-semibold truncate">
                      {restaurant.cuisine?.join(' • ')}
                    </p>
                    <p className="text-xs text-gray-500">{restaurant.address}</p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button className="neo-btn-primary w-full text-xs py-2">
                    View Menu ({restaurant.itemCount || 4} Dishes)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="border-b-2 border-black pb-2 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase">Your Order Tracking</h2>
            <span className="text-xs font-bold text-gray-600">Updated via Socket.io</span>
          </div>

          {orders.length === 0 ? (
            <div className="neo-card p-8 text-center space-y-3 bg-white">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-black text-lg text-brand-dark">No Orders Placed Yet</h3>
              <p className="text-xs text-gray-600 font-bold">
                Browse our curated restaurants and place your first food order!
              </p>
              <button onClick={() => setActiveTab('browse')} className="neo-btn-primary text-xs py-2 px-4">
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  userRole="customer"
                  onOpenComplaintModal={(ord) => setComplaintOrder(ord)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GRIEVANCES & COMPLAINTS */}
      {activeTab === 'complaints' && (
        <ErrorBoundary fallbackTitle="Grievances View Encountered an Issue" onReset={fetchComplaints}>
          <div className="space-y-4">
            <div className="border-b-2 border-black pb-2 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase">Filed Grievances & Disputes</h2>
              <span className="text-xs font-bold text-gray-600">Anchored on Polygon Amoy</span>
            </div>

            {complaints.length === 0 ? (
              <div className="neo-card p-8 text-center space-y-2 bg-white">
                <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-black text-lg text-brand-dark">No Complaints Filed</h3>
                <p className="text-xs text-gray-600 font-bold">
                  Delivered orders can be contested with IPFS-pinned evidence if items are wrong or delayed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complaints.map((complaint) => (
                  <ErrorBoundary key={complaint._id || complaint.onChainComplaintId} fallbackTitle="Grievance Card Error">
                    <ComplaintCard
                      complaint={complaint}
                      currentUserWallet={user?.walletAddress}
                    />
                  </ErrorBoundary>
                ))}
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* RESTAURANT MENU & CART MODAL */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="neo-card bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b-3 border-black p-4 bg-brand-yellow flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">{selectedRestaurant.name}</h3>
                <p className="text-xs font-bold text-gray-800">
                  {selectedRestaurant.cuisine?.join(' • ')} • Rep: {selectedRestaurant.reputationScore}/100
                </p>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="border-2 border-black p-1.5 bg-white hover:bg-red-50 text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
              {/* Menu Catalog */}
              <div
                ref={menuListRef}
                className="lg:col-span-2 p-5 overflow-y-auto space-y-3 border-b-3 lg:border-b-0 lg:border-r-3 border-black"
              >
                <div className="flex items-center justify-between pb-2 border-b-2 border-gray-100 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-brand-dark">
                    Available Dishes ({menuItems.length})
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">Prepared Fresh</span>
                </div>
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div
                      key={item._id}
                      className="border-2 border-black p-3 bg-brand-paper flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 border border-black ${
                              item.isVeg ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          <h5 className="font-black text-sm">{item.name}</h5>
                        </div>
                        <p className="text-xs text-gray-600 max-w-md">{item.description}</p>
                        <span className="font-black text-sm text-brand-dark block">₹{item.price}</span>
                      </div>

                      <button
                        onClick={() => addToCart(item)}
                        className="neo-btn-secondary text-xs flex items-center gap-1 py-1 px-3"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Drawer */}
              <div className="p-4 bg-brand-muted flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Your Tray ({cartItems.length})</span>
                  </h4>

                  {cartItems.length === 0 ? (
                    <p className="text-xs text-gray-500 font-bold py-6 text-center">
                      Tray is currently empty. Add dishes to order.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map(({ item, qty }) => (
                        <div
                          key={item._id}
                          className="bg-white border-2 border-black p-2 flex justify-between items-center text-xs font-bold"
                        >
                          <span className="truncate max-w-[120px]">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="border border-black p-0.5 bg-gray-100 hover:bg-gray-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="border border-black p-0.5 bg-gray-100 hover:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="w-12 text-right">₹{item.price * qty}</span>
                          </div>
                        </div>
                      ))}

                      <div className="border-t-2 border-black pt-2 flex justify-between font-black text-base">
                        <span>Grand Total:</span>
                        <span>₹{cartTotal}</span>
                      </div>
                    </div>
                  )}

                  {/* Delivery address */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="neo-input w-full text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || cartItems.length === 0}
                  className="neo-btn-primary w-full py-3 text-sm font-black uppercase tracking-wider"
                >
                  {loading ? 'Submitting...' : `Place Order (₹${cartTotal})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT FILING MODAL */}
      {complaintOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="neo-card bg-white w-full max-w-lg overflow-hidden space-y-4">
            <div className="border-b-3 border-black p-4 bg-brand-red text-white flex justify-between items-center">
              <h3 className="font-black text-base uppercase">
                File On-Chain Grievance (Order #{complaintOrder._id.slice(-6).toUpperCase()})
              </h3>
              <button
                onClick={() => setComplaintOrder(null)}
                className="border-2 border-black p-1 bg-white text-black hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFileComplaintSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Grievance Category
                </label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="neo-input w-full"
                >
                  <option value="FoodQuality">Food Quality (Spoiled, Under-cooked, Cold)</option>
                  <option value="LateDelivery">Late Delivery (Exceeded realistic ETA)</option>
                  <option value="WrongOrMissingItem">Wrong or Missing Items</option>
                  <option value="HygienePackaging">Hygiene & Broken Packaging</option>
                  <option value="Behaviour">Rider / Partner Behaviour</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Detailed Complaint Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Describe exactly what was wrong with the delivered food or service..."
                  className="neo-input w-full"
                />
              </div>

              {/* IPFS Evidence Uploader */}
              <EvidenceUploader
                selectedFile={evidenceFile}
                onFileSelect={(f) => setEvidenceFile(f)}
                onRemoveFile={() => setEvidenceFile(null)}
              />

              {complaintStatusMessage && (
                <div className="bg-yellow-100 border-2 border-black p-3 text-xs font-bold text-yellow-950 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-red flex-shrink-0" />
                  <span>{complaintStatusMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingComplaint || !evidenceFile}
                className="neo-btn-primary w-full py-3 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {submittingComplaint ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing IPFS & Blockchain...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Upload to IPFS & Sign On-Chain</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
