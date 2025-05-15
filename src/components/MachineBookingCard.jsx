// components/MachineBookingCard.js
import React from 'react';

const MachineBookingCard = ({ booking, onUnbook }) => {
  const { machine, machineType, dayName, id } = booking;

  return (
    <div className="machine-booking-card">
      <p>{machine} ({machineType}) on {dayName} at {id}</p>
      <button onClick={onUnbook}>Unbook</button>
    </div>
  );
};

export default MachineBookingCard;