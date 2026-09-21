import React from 'react';

const STATUS_CONFIGS = {
  // Order statuses
  PLACED: { label: 'Order Placed', bg: 'bg-yellow-200 text-yellow-900 border-black' },
  ACCEPTED: { label: 'Accepted by Kitchen', bg: 'bg-blue-200 text-blue-900 border-black' },
  PREPARING: { label: 'Cooking & Packing', bg: 'bg-orange-200 text-orange-900 border-black' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', bg: 'bg-indigo-200 text-indigo-900 border-black' },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-300 text-green-950 border-black' },
  CLOSED: { label: 'Closed', bg: 'bg-gray-200 text-gray-800 border-black' },

  // Complaint statuses
  Filed: { label: 'Complaint Filed', bg: 'bg-yellow-200 text-yellow-900 border-black' },
  AutoResolved: { label: 'Fault Accepted (Auto-Resolved)', bg: 'bg-red-200 text-red-900 border-black' },
  Contested: { label: 'Contested (Escalating)', bg: 'bg-orange-300 text-orange-950 border-black' },
  InDispute: { label: 'Active Jury Dispute', bg: 'bg-purple-200 text-purple-900 border-black' },
  Resolved: { label: 'Dispute Resolved', bg: 'bg-green-200 text-green-900 border-black' },
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIGS[status] || {
    label: status,
    bg: 'bg-gray-100 text-gray-800 border-black',
  };

  return (
    <span className={`neo-badge ${config.bg} ${className}`}>
      {config.label}
    </span>
  );
};
