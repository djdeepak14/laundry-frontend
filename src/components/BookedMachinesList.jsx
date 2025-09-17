import React from 'react';
import axios from 'axios';

const API_URL = 'https://laundry-backend-8x1e.onrender.com'; // replace with your backend URL

const BookedMachinesList = ({ weekBookings, onBookingCancelled }) => {

  // Cancel booking function
  const handleUnbook = async (bookingId) => {
    if (!bookingId) return;

    try {
      const token = localStorage.getItem('token'); // Ensure token is stored
      await axios.delete(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Booking cancelled successfully!');
      // Call parent function to refresh bookings
      onBookingCancelled(bookingId);

    } catch (error) {
      console.error('Delete booking error:', error.response?.data || error.message);
      alert('Failed to cancel booking. Check console for details.');
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-bold mb-2">Booked Machines</h2>

      {weekBookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <ul>
          {weekBookings.map((booking) => (
            <li key={booking._id} className="mb-2">
              {new Date(booking.date).toLocaleDateString()} - {booking.machine} ({booking.machineType}) - {booking.dayName}
              <button
                onClick={() => handleUnbook(booking._id)}
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
