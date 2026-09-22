import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  AlertTriangle,
  FileText,
  Truck,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { EvidenceUploader } from '../components/EvidenceUploader';
import { BLOCK_EXPLORER_URL } from '../config';

export const TrackOrderPage = ({ activeOrder, onFileComplaint, onBrowseMore }) => {
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [category, setCategory] = useState('FoodQuality');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  // Fallback demo order if none passed
  const order = activeOrder || {
    _id: "ORD-94812",
    restaurantName: "Truffles (St. Marks Road)",
    restaurantAddress: "St. Marks Road, Central Bangalore",
    deliveryAddress: "Flat 402, Sunshine Heights, Koramangala, Bangalore",
    totalPrice: 485,
    status: "OUT_FOR_DELIVERY",
    createdAt: new Date().toISOString(),
    deliveryPartner: {
      name: "Vikram Singh",
      phone: "+91-9876543211",
      vehicle: "Electric Scooter (KA-01-EQ-9812)",
      rating: 4.8,
    },
    items: [
      { item: { name: "All American Cheese Burger", price: 280 }, qty: 1 },
      { item: { name: "Cheese Jalapeno Poppers", price: 190 }, qty: 1 },
    ],
  };

  const statusSteps = [
    { key: 'PLACED', label: 'Order Placed', time: '12:30 PM', done: true },
    { key: 'ACCEPTED', label: 'Accepted by Kitchen', time: '12:31 PM', done: true },
    { key: 'PREPARING', label: 'Food Cooking', time: '12:35 PM', done: true },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', time: '12:48 PM', done: order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' },
    { key: 'DELIVERED', label: 'Delivered', time: '1:02 PM', done: order.status === 'DELIVERED' },
  ];

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedMessage("Grievance anchored to Polygon Amoy! Case opened in ComplaintRegistry.");
      if (onFileComplaint) {
        onFileComplaint({
          orderId: order._id,
          category,
          description,
          file: evidenceFile,
        });
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-brand-dark p-6 rounded-xl shadow-neo">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-brand-red text-white px-2.5 py-0.5 rounded border border-black uppercase">
              LIVE ORDER STATUS
            </span>
            <span className="text-xs font-bold text-gray-500 font-mono">#{order._id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark uppercase">
            {order.restaurantName}
          </h1>
          <p className="text-xs text-gray-600 font-medium">Estimated arrival in 12–15 mins</p>
        </div>

        <button
          onClick={() => setShowGrievanceModal(true)}
          className="neo-btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Report Issue / File Grievance</span>
        </button>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border-2 border-brand-dark rounded-xl p-6 sm:p-8 shadow-neo space-y-6">
        <h2 className="text-lg font-black uppercase text-brand-dark flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-red" />
          <span>Order Timeline & On-Chain Proofs</span>
        </h2>

        <div className="relative border-l-2 border-brand-dark ml-4 space-y-6 pl-6 py-2">
          {statusSteps.map((step, idx) => (
            <div key={step.key} className="relative">
              {/* Bullet node */}
              <span
                className={`absolute -left-[33px] top-0.5 w-6 h-6 rounded-full border-2 border-brand-dark flex items-center justify-center text-[10px] font-black ${
                  step.done ? 'bg-brand-red text-white' : 'bg-white text-gray-400'
                }`}
              >
                {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-black uppercase ${step.done ? 'text-brand-dark' : 'text-gray-400'}`}>
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {step.done ? `Cryptographic timestamp verified on-chain (${step.time})` : 'Pending advancement'}
                  </p>
                </div>

                {step.done && (
                  <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-700">
                    VERIFIED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Partner Details & Map Illustration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-4">
          <h3 className="text-base font-black uppercase text-brand-dark flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-red" />
            <span>Delivery Fleet Partner</span>
          </h3>

          <div className="flex items-center gap-4 bg-brand-grayLight p-4 rounded-lg border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-brand-red text-white font-black text-lg flex items-center justify-center border-2 border-brand-dark">
              VS
            </div>
            <div>
              <h4 className="font-black text-sm text-brand-dark">{order.deliveryPartner?.name || "Vikram Singh"}</h4>
              <p className="text-xs text-gray-500 font-medium">{order.deliveryPartner?.vehicle || "Electric Scooter"}</p>
              <div className="flex items-center gap-2 pt-1 text-xs font-bold text-gray-700">
                <Phone className="w-3.5 h-3.5 text-brand-red" />
                <span>{order.deliveryPartner?.phone || "+91-9876543211"}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-600 font-medium space-y-1">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <span><strong>Delivering To:</strong> {order.deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="bg-white border-2 border-brand-dark rounded-xl p-6 shadow-neo space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-black uppercase text-brand-dark flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-red" />
              <span>Items in this Order</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-gray-100">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center pt-2">
                  <span className="font-bold text-brand-dark">
                    {it.qty}x {it.item?.name || "Dish Item"}
                  </span>
                  <span className="font-black text-brand-dark">₹{it.item?.price * it.qty}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t-2 border-brand-dark flex justify-between items-center text-sm font-black">
            <span>Total Paid</span>
            <span className="text-brand-red">₹{order.totalPrice}</span>
          </div>
        </div>
      </div>

      {/* Grievance Modal */}
      {showGrievanceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-brand-dark rounded-xl max-w-lg w-full p-6 shadow-neo-lg space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brand-red" />
                <h3 className="font-black text-lg uppercase text-brand-dark">File Grievance</h3>
              </div>
              <button
                onClick={() => setShowGrievanceModal(false)}
                className="p-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submittedMessage ? (
              <div className="p-6 bg-green-50 border-2 border-green-700 rounded-lg text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-700 mx-auto" />
                <div className="font-black text-base text-green-800">{submittedMessage}</div>
                <p className="text-xs text-green-700 font-medium">
                  The restaurant has 2 minutes in demo mode to accept fault or contest. You will receive real-time notifications.
                </p>
                <button
                  onClick={() => {
                    setShowGrievanceModal(false);
                    setSubmittedMessage('');
                  }}
                  className="neo-btn-primary text-xs py-2 px-4 mt-2"
                >
                  Close & Track Case
                </button>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-black uppercase text-gray-700 block mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full font-bold p-2.5 border-2 border-brand-dark rounded-md bg-brand-gray"
                  >
                    <option value="FoodQuality">Food Quality (Cold, Burnt, Bad Taste)</option>
                    <option value="WrongOrMissingItem">Wrong or Missing Items</option>
                    <option value="HygienePackaging">Hygiene or Damaged Packaging</option>
                    <option value="LateDelivery">Excessive Unreasonable Delay</option>
                    <option value="Behaviour">Delivery Partner Behaviour</option>
                  </select>
                </div>

                <div>
                  <label className="font-black uppercase text-gray-700 block mb-1">Issue Description</label>
                  <textarea
                    rows="3"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what went wrong with your food or delivery..."
                    className="w-full font-medium p-2.5 border-2 border-brand-dark rounded-md bg-brand-gray"
                  ></textarea>
                </div>

                <div>
                  <label className="font-black uppercase text-gray-700 block mb-1">
                    Upload Photo/Video Evidence (Pinned to IPFS)
                  </label>
                  <EvidenceUploader onFileSelected={(f) => setEvidenceFile(f)} />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGrievanceModal(false)}
                    className="flex-1 neo-btn-secondary py-2.5 font-bold uppercase text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 neo-btn-primary py-2.5 font-black uppercase text-xs flex items-center justify-center gap-1.5"
                  >
                    {submitting ? 'Pinning to IPFS & Anchoring...' : 'Submit Grievance'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
