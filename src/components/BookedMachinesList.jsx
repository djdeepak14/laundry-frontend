// components/BookedMachinesList.js
import React from 'react';

const BookedMachinesList = ({ weekBookings, selectedWeekKey, handleUnbook }) => {
  if (!weekBookings || weekBookings.length === 0) {
    return (
      <div className="booked-list">
        <h2>Booked Machines</h2>
        <p>No bookings for this week.</p>
      </div>
    );
  }

  return (
    <div className="booked-list">
      <h2>Booked Machines</h2>
      <ul>
        {weekBookings.map(booking => (
          <li key={booking.id}>
            <span>
              {booking.machine} ({booking.machineType}) on {booking.dayName} at {booking.id}
            </span>
            <button onClick={() => handleUnbook(selectedWeekKey, booking.id)}>
              Unbook
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookedMachinesList;