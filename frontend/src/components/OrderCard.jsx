import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Clock, MapPin, ChefHat, Bike, AlertCircle } from 'lucide-react';
import { BLOCK_EXPLORER_URL } from '../config';

export const OrderCard = ({
  order,
  userRole,
  onStatusAdvance,
  onOpenComplaintModal,
}) => {
  const steps = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIndex = steps.indexOf(order.status);

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
            Order #{order._id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {order.onChainOrderKey && (
          <a
            href={`${BLOCK_EXPLORER_URL}/search?q=${order.onChainOrderKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-700 underline bg-blue-50 border border-black px-2 py-1"
          >
            ⛓️ On-Chain Anchor
          </a>
        )}
      </div>

      {/* Progress Stepper Bar */}
      <div className="py-2">
        <div className="grid grid-cols-5 gap-1 text-center text-xs font-bold">
          {steps.map((step, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;
            return (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-full h-3 border-2 border-black ${
                    isCurrent
                      ? 'bg-brand-yellow animate-pulse'
                      : isCompleted
                      ? 'bg-brand-green'
                      : 'bg-gray-100'
                  }`}
                />
                <span className="text-[10px] uppercase font-bold mt-1 text-gray-700 hidden sm:inline">
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div className="bg-brand-muted border-2 border-black p-3 space-y-1.5 text-xs font-semibold">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span>
              <strong className="font-black">{item.qty}x</strong> {item.name}
            </span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}
        <div className="border-t border-black pt-1.5 flex justify-between font-black text-sm text-brand-dark">
          <span>Total Paid:</span>
          <span>₹{order.totalPrice}</span>
        </div>
      </div>

      {/* Delivery details */}
      <div className="flex flex-wrap items-center justify-between text-xs text-gray-700 gap-2">
        <div className="flex items-center gap-1.5 font-bold">
          <MapPin className="w-4 h-4 text-brand-red" />
          <span>{order.deliveryAddress}</span>
        </div>
        {order.deliveryPartnerId && (
          <div className="flex items-center gap-1.5 font-bold bg-white border border-black px-2 py-1">
            <Bike className="w-4 h-4 text-brand-dark" />
            <span>Rider: {order.deliveryPartnerId.name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons based on role */}
      <div className="pt-2 flex flex-wrap gap-2 border-t-2 border-black">
        {/* Customer actions */}
        {userRole === 'customer' && (order.status === 'DELIVERED' || order.status === 'CLOSED') && (
          <button
            onClick={() => onOpenComplaintModal(order)}
            className="neo-btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <AlertCircle className="w-4 h-4" />
            <span>File Complaint with IPFS Evidence</span>
          </button>
        )}

        {/* Restaurant actions */}
        {userRole === 'restaurant' && order.status === 'PLACED' && (
          <button
            onClick={() => onStatusAdvance(order._id, 'ACCEPTED')}
            className="neo-btn-secondary text-xs"
          >
            Accept Order
          </button>
        )}
        {userRole === 'restaurant' && order.status === 'ACCEPTED' && (
          <button
            onClick={() => onStatusAdvance(order._id, 'PREPARING')}
            className="neo-btn-secondary text-xs"
          >
            Mark Preparing
          </button>
        )}

        {/* Delivery Partner actions */}
        {userRole === 'delivery_partner' && order.status === 'PREPARING' && (
          <button
            onClick={() => onStatusAdvance(order._id, 'OUT_FOR_DELIVERY')}
            className="neo-btn-primary text-xs"
          >
            Pick Up & Start Delivery
          </button>
        )}
        {userRole === 'delivery_partner' && order.status === 'OUT_FOR_DELIVERY' && (
          <button
            onClick={() => onStatusAdvance(order._id, 'DELIVERED')}
            className="neo-btn-secondary text-xs"
          >
            Mark Delivered
          </button>
        )}

        {/* Admin God Mode actions */}
        {userRole === 'admin' && (
          <div className="flex flex-wrap items-center gap-1.5 bg-purple-50 border border-black p-1.5">
            <span className="text-[10px] font-black uppercase text-purple-900">Force Status:</span>
            {steps.map((s) => (
              <button
                key={s}
                onClick={() => onStatusAdvance(order._id, s)}
                className={`text-[10px] font-bold px-1.5 py-0.5 border border-black ${
                  order.status === s ? 'bg-purple-600 text-white' : 'bg-white hover:bg-purple-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
