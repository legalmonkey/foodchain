import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { Clock, MapPin, ChefHat, Bike, AlertCircle, Lock, X, Copy, Check, ExternalLink } from 'lucide-react';
import { BLOCK_EXPLORER_URL, CONTRACT_ADDRESSES } from '../config';

export const OrderCard = ({
  order,
  userRole,
  onStatusAdvance,
  onOpenComplaintModal,
}) => {
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const steps = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = steps.indexOf(order.status);

  const handleCopyKey = () => {
    if (!order.onChainOrderKey) return;
    navigator.clipboard.writeText(order.onChainOrderKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const orderRegistryAddress = CONTRACT_ADDRESSES?.OrderRegistry || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  return (
    <div className="neo-card p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-lg">
              {order.restaurantId?.name || 'Restaurant'}
            </h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-600 font-semibold mt-0.5">
            Order #{order._id?.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {order.onChainOrderKey && (
          <button
            type="button"
            onClick={() => setShowAnchorModal(true)}
            className="text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-brand-dark px-2.5 py-1 rounded shadow-neo-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Inspect cryptographic on-chain anchor"
          >
            <Lock className="w-3.5 h-3.5 text-blue-700" />
            <span>On-Chain Anchor</span>
          </button>
        )}
      </div>

      {/* Progress Stepper Bar */}
      <div className="py-2">
        <div className="grid grid-cols-5 gap-1 text-center text-xs font-bold">
          {steps.map((step, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;
            return (
              <div key={step} className="space-y-1">
                <div
                  className={`h-2 border border-black transition-all ${
                    isCompleted ? 'bg-brand-yellow' : 'bg-gray-200'
                  } ${isCurrent ? 'ring-2 ring-black' : ''}`}
                />
                <span
                  className={`text-[10px] block uppercase font-black truncate ${
                    isCurrent ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  {step.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Summary */}
      <div className="space-y-1 bg-white border border-black p-3">
        {order.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs font-semibold">
            <span>
              {item.qty}x {item.name || item.menuItemId?.name}
            </span>
            <span className="font-mono">₹{item.price * item.qty}</span>
          </div>
        ))}
        <div className="border-t border-black pt-1.5 mt-2 flex justify-between font-black text-xs">
          <span>Total Paid:</span>
          <span className="font-mono text-sm">₹{order.totalPrice}</span>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="text-xs text-gray-600 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0" />
        <span className="truncate">{order.deliveryAddress}</span>
      </div>

      {/* Assigned Delivery Partner (if any) */}
      {order.deliveryPartnerId && (
        <div className="bg-brand-muted border border-black p-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-brand-dark" />
            <span className="font-bold">
              Rider: {order.deliveryPartnerId.name || 'Assigned Delivery Partner'}
            </span>
          </div>
          {order.deliveryPartnerId.phone && (
            <span className="text-[11px] text-gray-500 font-mono">
              {order.deliveryPartnerId.phone}
            </span>
          )}
        </div>
      )}

      {/* Action Buttons based on User Role */}
      <div className="pt-2 border-t border-black flex flex-wrap justify-between items-center gap-2">
        {/* Customer Actions */}
        {userRole === 'customer' && (
          <div className="w-full flex justify-end">
            {order.status === 'DELIVERED' && (
              <button
                onClick={() => onOpenComplaintModal(order)}
                className="neo-btn bg-red-100 hover:bg-red-200 text-red-950 text-xs flex items-center gap-1 py-1.5 px-3 border border-brand-dark rounded"
              >
                <AlertCircle className="w-3.5 h-3.5 text-brand-red" />
                <span>File Grievance / Dispute</span>
              </button>
            )}
          </div>
        )}

        {/* Restaurant Advance Actions */}
        {userRole === 'restaurant' && (
          <div>
            {order.status === 'PLACED' && (
              <button
                onClick={() => onStatusAdvance(order._id, 'ACCEPTED')}
                className="neo-btn-primary text-xs"
              >
                Accept Order
              </button>
            )}
            {order.status === 'ACCEPTED' && (
              <button
                onClick={() => onStatusAdvance(order._id, 'PREPARING')}
                className="neo-btn-primary text-xs"
              >
                Start Cooking
              </button>
            )}
            {order.status === 'PREPARING' && (
              <button
                onClick={() => onStatusAdvance(order._id, 'OUT_FOR_DELIVERY')}
                className="neo-btn-primary text-xs"
              >
                Handover to Rider
              </button>
            )}
          </div>
        )}

        {/* Delivery Partner Advance Actions */}
        {userRole === 'delivery_partner' && order.status === 'OUT_FOR_DELIVERY' && (
          <button
            onClick={() => onStatusAdvance(order._id, 'DELIVERED')}
            className="neo-btn-secondary text-xs"
          >
            Mark Delivered
          </button>
        )}

        {/* Admin Override actions */}
        {userRole === 'admin' && (
          <div className="flex flex-wrap items-center gap-1.5 bg-brand-gray border border-brand-dark p-1.5 rounded">
            <span className="text-[10px] font-black uppercase text-brand-dark">Force Status:</span>
            {steps.map((s) => (
              <button
                key={s}
                onClick={() => onStatusAdvance(order._id, s)}
                className={`text-[10px] font-bold px-1.5 py-0.5 border border-brand-dark rounded ${
                  order.status === s ? 'bg-brand-dark text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* On-Chain Cryptographic Anchor Details Modal */}
      {showAnchorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="neo-card bg-white w-full max-w-lg p-6 space-y-5 rounded-xl border-3 border-brand-dark shadow-neo">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-brand-dark pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 border border-brand-dark flex items-center justify-center text-blue-800">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-brand-dark">
                    On-Chain Cryptographic Anchor
                  </h3>
                  <span className="text-[10px] font-bold text-green-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                    Verified Polygon Protocol State Commitment
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAnchorModal(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 border border-transparent hover:border-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cryptographic Details */}
            <div className="space-y-3 text-xs">
              {/* Order Commitment Key */}
              <div className="bg-brand-gray p-3 rounded-lg border border-brand-dark space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-500">
                    Order Commitment Key (bytes32 keccak256):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[10px] font-bold text-brand-red flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-green-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[11px] font-semibold text-brand-dark break-all bg-white p-2 border border-gray-300 rounded select-all">
                  {order.onChainOrderKey}
                </div>
              </div>

              {/* Contract Binding */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2.5 rounded border border-gray-300 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Target Contract</span>
                  <span className="font-black text-xs text-brand-dark block">OrderRegistry.sol</span>
                  <span className="text-[10px] font-mono text-gray-600 block truncate">
                    {orderRegistryAddress}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded border border-gray-300 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Algorithm</span>
                  <span className="font-black text-xs text-brand-dark block">keccak256(UTF8(OrderId))</span>
                  <span className="text-[10px] text-gray-600 block">Tamper-Proof SHA-3 Family</span>
                </div>
              </div>

              {/* Order Metadata in Commitment */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1 text-[11px] font-medium text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Off-Chain Order ID:</span>
                  <span className="font-mono font-bold text-brand-dark">{order._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Restaurant:</span>
                  <span className="font-semibold">{order.restaurantId?.name || 'Truffles'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Value:</span>
                  <span className="font-black text-brand-dark">₹{order.totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lifecycle Status:</span>
                  <span className="font-bold text-brand-red">{order.status}</span>
                </div>
              </div>
            </div>

            {/* Explorer Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {order.txHash ? (
                <a
                  href={`${BLOCK_EXPLORER_URL}/tx/${order.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn-primary flex-1 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 text-center"
                >
                  <span>View Transaction on PolygonScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a
                  href={`${BLOCK_EXPLORER_URL}/address/${orderRegistryAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn-secondary flex-1 py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5 text-center"
                >
                  <span>View OrderRegistry on PolygonScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowAnchorModal(false)}
                className="border-2 border-brand-dark px-4 py-2 text-xs font-black rounded hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
