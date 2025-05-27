import React from 'react';

const BookedMachinesList = ({ weekBookings, handleUnbook, selectedWeekKey }) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-bold mb-2">Booked Machines</h2>
      {weekBookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <ul>
          {weekBookings.map((booking) => (
            <li key={booking.id} className="mb-2">
              {new Date(booking.date).toLocaleDateString()} - {booking.machine} ({booking.machineType}) - {booking.dayName}
              <button
                onClick={() => handleUnbook(selectedWeekKey, booking.id)}
                className="ml-2 text-red-600 underline"
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookedMachinesList;
