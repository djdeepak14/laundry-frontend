import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const LaundryBookingPage = ({
  selectedDay,
  machines,
  timeSlots,
  selectedSlots,
  toggleBooking,
  weekBookings,
  selectedWeekKey
}) => {
  const [openMachines, setOpenMachines] = useState({});
  const navigate = useNavigate();

  const toggleMachineOpen = (machineName) => {
    setOpenMachines(prev => ({
      ...prev,
      [machineName]: !prev[machineName]
    }));
  };

  return (
    <div className="container">
      {/* Page Heading */}
      <h1>Schedule for {selectedDay.dayName}, {selectedDay.date.toDateString()}</h1>

      {/* Buttons below date */}
      <div className="action-buttons">
        <button className="home-button" onClick={() => navigate('/')}>Home</button>
        <button 
          className="book-laundry-button"
          onClick={() => alert("Booking functionality here!")}
        >
          Book Laundry
        </button>
      </div>

      {/* Machine Schedules */}
      {machines.map(machine => (
        <div key={machine.name} className="machine-schedule">
          <h3 onClick={() => toggleMachineOpen(machine.name)}>
            {machine.name} ({machine.type}) {openMachines[machine.name] ? '▲' : '▼'}
          </h3>

          {openMachines[machine.name] && (
            <div className="time-slots-grid">
              {timeSlots.map(slot => {
                const slotId = `${selectedDay.date.toDateString()}_${machine.name}_${slot}`;
                const isBooked = Boolean(selectedSlots[slotId]);

                return (
                  <div key={slotId} className="time-slot-item">
                    <span className="time-slot-label">{slot}</span>
                    <button
                      className={`time-slot-button ${isBooked ? 'unbook' : 'book'}`}
                      onClick={() => toggleBooking(slotId, machine.name, machine.type)}
                    >
                      {isBooked ? 'Unbook' : 'Book'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* List of Current Week Bookings */}
      <div className="booked-list">
        <h2>My Bookings</h2>
        <ul>
          {weekBookings.map(booking => (
            <li key={booking.id}>
              {booking.machine} ({booking.machineType}) - {booking.date.toDateString()} {booking.dayName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LaundryBookingPage;
