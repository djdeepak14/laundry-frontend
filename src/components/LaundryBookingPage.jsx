// src/components/LaundryBookingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SelectedDaySchedule from './SelectedDaySchedule';

const LaundryBookingPage = ({
  selectedDay,
  machines,
  timeSlots,
  selectedSlots,
  toggleBooking,
  isSlotDisabled,
  weekBookings,
}) => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="laundry-header">
        <button onClick={() => navigate('/')} className="home-button">
          Home
        </button>
        <h1>Laundry Booking</h1>
      </div>
      {selectedDay ? (
        <SelectedDaySchedule
          selectedDay={selectedDay}
          machines={machines}
          timeSlots={timeSlots}
          selectedSlots={selectedSlots}
          toggleBooking={toggleBooking}
          isSlotDisabled={isSlotDisabled}
          weekBookings={weekBookings}
        />
      ) : (
        <p>Please select a day from the Home page to book a machine.</p>
      )}
    </div>
  );
};

export default LaundryBookingPage;
