import React from 'react';

const BookedMachinesList = ({ weekBookings, handleUnbook, selectedWeekKey }) => {
  if (!weekBookings || weekBookings.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl shadow max-w-lg mx-auto">
        <h2 className="text-lg font-bold mb-4">Week: {selectedWeekKey}</h2>
        <p>No bookings for this week.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow max-w-lg mx-auto">
      <h2 className="text-lg font-bold mb-4">Bookings for week: {selectedWeekKey}</h2>
      <ul className="space-y-3">
        {weekBookings.map((booking) => (
          <li
            key={booking._id}
            className="p-3 border border-gray-300 rounded flex justify-between items-center"
          >
            <div>
              <div><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</div>
              <div><strong>Machine:</strong> {booking.machine} ({booking.machineType})</div>
              <div><strong>Day:</strong> {booking.dayName}</div>
            </div>
            <button
              onClick={() => handleUnbook(booking._id)}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookedMachinesList;
