import React from 'react';

const MachineBookingCard = ({ booking }) => {
  return (
    <div className="p-3 mb-2 border-l-4 border-blue-500 bg-blue-50 rounded shadow">
      <div><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</div>
      <div><strong>Machine:</strong> {booking.machine} ({booking.machineType})</div>
      <div><strong>Day:</strong> {booking.dayName}</div>
    </div>
  );
};

export default MachineBookingCard;
