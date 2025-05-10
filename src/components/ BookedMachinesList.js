import React from 'react';

const BookedMachinesList = ({ weekBookings, selectedWeekKey, handleUnbook }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Your Booked Machines This Week</h3>
      {weekBookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <ul className="list-disc pl-5">
          {weekBookings.map((booking, index) => (
            <li key={index} className="flex justify-between items-center mb-1">
              <span>
                {booking.machine} on {booking.day} at {booking.time}
              </span>
              <button
                onClick={() => handleUnbook(selectedWeekKey, booking.id)}
                className="text-red-500 underline"
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
