import React from 'react';

const BookingListPage = ({ bookings, handleUnbook }) => {
  return (
    <div className="booking-list-page">
      <h2>My Bookings</h2>
      {Object.entries(bookings).map(([weekKey, weekBookings]) => (
        <div key={weekKey}>
          <h3>{weekKey}</h3>
          <ul>
            {weekBookings.map(booking => (
              <li key={booking.id}>
                {new Date(booking.date).toLocaleDateString()} - {booking.machine} ({booking.machineType})
                <button onClick={() => handleUnbook(weekKey, booking.id)}>Cancel</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default BookingListPage;
