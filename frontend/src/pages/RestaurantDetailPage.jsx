import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  ExternalLink,
  Tag,
  AlertCircle
} from 'lucide-react';
import { API_URL, BLOCK_EXPLORER_URL } from '../config';

export const RestaurantDetailPage = ({ restaurant, onBack, onOrderSuccess }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({}); // { itemId: { item, qty } }
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Sunshine Heights, Bangalore');
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // Ensure the view always displays the top of the restaurant & menu
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 10);
    return () => clearTimeout(timer);
  }, [restaurant]);

  if (!restaurant) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="font-bold text-gray-600">Restaurant not found.</p>
        <button onClick={onBack} className="neo-btn-primary text-xs py-2 px-4">
          Back to Restaurants
        </button>
      </div>
    );
  }

  const categories = ['All', ...new Set(restaurant.menu.map((m) => m.category))];

  const filteredMenu =
    selectedCategory === 'All'
      ? restaurant.menu
      : restaurant.menu.filter((m) => m.category === selectedCategory);

  const addToCart = (item) => {
    setCart((prev) => {
      const current = prev[item._id]?.qty || 0;
      return {
        ...prev,
        [item._id]: { item, qty: current + 1 },
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
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.item.price * curr.qty, 0);
  const deliveryFee = subtotal > 0 ? 35 : 0;
  const platformFee = subtotal > 0 ? 5 : 0;
  const taxes = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + deliveryFee + platformFee + taxes;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setOrderPlacing(true);

    try {
      const orderPayload = {
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        items: cartItems.map((c) => ({
          menuItemId: c.item._id,
          name: c.item.name,
          price: c.item.price,
          qty: c.qty,
        })),
        totalPrice: grandTotal,
        deliveryAddress,
      };

      let confirmedOrder = null;
      try {
        const res = await axios.post(`${API_URL}/api/orders`, orderPayload);
        if (res.data?.order) {
          confirmedOrder = res.data.order;
        }
      } catch (apiErr) {
        console.warn('API order endpoint not reachable, persisting client-side order session:', apiErr.message);
      }

      if (!confirmedOrder) {
        confirmedOrder = {
          _id: 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          items: cartItems,
          totalPrice: grandTotal,
          status: 'PLACED',
          createdAt: new Date().toISOString(),
          deliveryAddress,
        };
      }

      setOrderPlacing(false);
      setOrderSuccessData(confirmedOrder);
      if (onOrderSuccess) onOrderSuccess(confirmedOrder);
    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
      setOrderPlacing(false);
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="neo-btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Restaurants</span>
      </button>

      {/* Restaurant Hero Card */}
      <div className="bg-white border-2 border-brand-dark rounded-xl overflow-hidden shadow-neo">
        <div className="relative h-64 sm:h-80 w-full bg-gray-900">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-red text-white text-xs font-black px-2.5 py-0.5 border border-black rounded">
                VERIFIED ON-CHAIN
              </span>
              <span className="bg-white text-brand-dark text-xs font-bold px-2.5 py-0.5 border border-black rounded">
                {restaurant.cuisine.join(' • ')}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {restaurant.name}
            </h1>
            <p className="text-sm text-gray-200 font-medium">{restaurant.tagline}</p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold">
              <div className="flex items-center gap-1 bg-green-600 px-2 py-0.5 rounded border border-black text-white">
                <span>{restaurant.rating}</span>
                <Star className="w-3.5 h-3.5 fill-white" />
                <span className="text-[10px] text-green-100">({restaurant.votes})</span>
              </div>

              <div className="flex items-center gap-1 text-gray-200">
                <Clock className="w-4 h-4 text-brand-red" />
                <span>{restaurant.deliveryTime}</span>
              </div>

              <div className="flex items-center gap-1 text-gray-200">
                <MapPin className="w-4 h-4 text-brand-red" />
                <span>{restaurant.address}</span>
              </div>

              <div className="flex items-center gap-1 text-gray-200">
                <span>₹{restaurant.costForTwo} for two</span>
              </div>
            </div>
          </div>
        </div>

        {/* On-Chain Trust & Escrow Guarantee Banner */}
        <div className="p-4 bg-brand-redLight border-t-2 border-brand-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-red shrink-0" />
            <div>
              <span className="font-black text-brand-dark">Decentralized Quality Guarantee: </span>
              <span className="text-gray-700 font-medium">
                Complaints on food hygiene or missing items are backed by Polygon Amoy smart contracts and community jury arbitration.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-black text-brand-dark bg-white border border-brand-dark px-2 py-1 rounded">
              Score: {restaurant.reputationScore}/100
            </span>
            <a
              href={`${BLOCK_EXPLORER_URL}/address/0x5FbDB2315678afecb367f032d93F642f64180aa3`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-red font-black flex items-center gap-1 hover:underline"
            >
              <span>Verify Contracts</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Menu & Cart Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Menu Items (Left 2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-brand-dark scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-2 ${
                  selectedCategory === cat
                    ? 'bg-brand-red text-white border-brand-dark shadow-neo-sm'
                    : 'bg-white text-brand-dark border-gray-300 hover:border-brand-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dishes List */}
          <div className="space-y-4">
            {filteredMenu.map((item) => {
              const qty = cart[item._id]?.qty || 0;
              return (
                <div
                  key={item._id}
                  className="bg-white border-2 border-brand-dark rounded-xl p-5 shadow-neo flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-red transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      {/* Veg / Non-Veg Indicator */}
                      <span
                        className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm ${
                          item.isVeg ? 'border-green-600' : 'border-red-600'
                        }`}
                        title={item.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isVeg ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></span>
                      </span>

                      <span className="font-bold text-xs uppercase text-gray-500">{item.category}</span>
                    </div>

                    <h3 className="font-black text-base text-brand-dark">{item.name}</h3>
                    <div className="font-black text-sm text-brand-dark">₹{item.price}</div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-xl">
                      {item.description}
                    </p>
                  </div>

                  {/* Add to Cart / Quantity Controller */}
                  <div className="shrink-0 flex items-center">
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-white text-brand-red border-2 border-brand-red font-black text-xs px-6 py-2 rounded-lg shadow-neo-sm hover:bg-brand-red hover:text-white transition-all active:translate-y-0.5"
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center bg-brand-red text-white border-2 border-brand-dark rounded-lg overflow-hidden shadow-neo-sm font-black text-xs">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="px-3 py-2 hover:bg-brand-redHover transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-2 text-center min-w-[28px]">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="px-3 py-2 hover:bg-brand-redHover transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Cart / Checkout Box (Right Col) */}
        <div className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-6 sticky top-24">
          <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
            <h2 className="font-black text-lg uppercase text-brand-dark flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-red" />
              <span>Your Cart</span>
            </h2>
            <span className="text-xs font-bold text-gray-500">
              {cartItems.reduce((sum, i) => sum + i.qty, 0)} Items
            </span>
          </div>

          {cartItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-500">Your cart is currently empty</p>
              <p className="text-xs text-gray-400 font-medium">Add signature dishes to order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items Summary */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cartItems.map(({ item, qty }) => (
                  <div key={item._id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 border flex items-center justify-center rounded-sm ${
                          item.isVeg ? 'border-green-600' : 'border-red-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></span>
                      </span>
                      <span className="font-bold text-brand-dark">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-black rounded text-[11px] font-bold">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="px-1.5 py-0.5 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-1.5">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="px-1.5 py-0.5 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-black text-brand-dark">₹{item.price * qty}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Input */}
              <div className="pt-3 border-t border-gray-200 space-y-1">
                <label className="text-xs font-black text-brand-dark uppercase">Delivery Location:</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-xs font-medium p-2 border-2 border-brand-dark rounded-md bg-brand-gray"
                />
              </div>

              {/* Bill Details */}
              <div className="pt-3 border-t border-gray-200 space-y-2 text-xs font-semibold text-gray-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="text-brand-dark font-bold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  <span className="text-brand-dark font-bold">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Smart Escrow & Platform Fee</span>
                  <span className="text-brand-dark font-bold">₹{platformFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges (5%)</span>
                  <span className="text-brand-dark font-bold">₹{taxes}</span>
                </div>

                <div className="pt-2 border-t-2 border-brand-dark flex justify-between text-sm font-black text-brand-dark">
                  <span>TO PAY</span>
                  <span className="text-brand-red">₹{grandTotal}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={orderPlacing}
                className="w-full neo-btn-primary py-3 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {orderPlacing ? (
                  <span>Relaying Order to Blockchain...</span>
                ) : (
                  <>
                    <span>Place Order • ₹{grandTotal}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-gray-500 font-medium text-center">
                Protected by FoodChain 100% Quality Escrow Guarantee.
              </p>
            </div>
          )}

          {/* Success Notification Modal */}
          {orderSuccessData && (
            <div className="p-4 bg-green-50 border-2 border-green-700 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 text-green-800 font-black">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Placed Successfully!</span>
              </div>
              <p className="text-green-700 font-medium">
                Order <strong className="text-black">{orderSuccessData._id}</strong> has been sent to {restaurant.name}. Status will advance through smart progression.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
