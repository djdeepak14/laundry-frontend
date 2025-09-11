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
  handleUnbook, // expects booking _id
}) => {
  const [openMachines, setOpenMachines] = useState({});
  const navigate = useNavigate();

  const toggleMachineOpen = (machineName) => {
    setOpenMachines(prev => ({
      ...prev,
      [machineName]: !prev[machineName]
    }));
  };

  // Convert selectedDay.date safely
  const selectedDayDate = selectedDay.date instanceof Date 
    ? selectedDay.date 
    : new Date(selectedDay.date);

  return (
    <div className="container">
      {/* Home Button */}
      <div className="home-header">
        <button className="home-button" onClick={() => navigate('/')}>Home</button>
      </div>

      {/* Page Heading */}
      <h1>Schedule for {selectedDay.dayName}, {selectedDayDate.toDateString()}</h1>

      {/* Machine Schedules */}
      {machines.map(machine => (
        <div key={machine.name} className="machine-schedule">
          <h3 onClick={() => toggleMachineOpen(machine.name)}>
            {machine.name} ({machine.type}) {openMachines[machine.name] ? '▲' : '▼'}
          </h3>

          {openMachines[machine.name] && (
            <div className="time-slots-grid">
              {timeSlots.map(slot => {
                const slotId = `${selectedDayDate.toDateString()}_${machine.name}_${slot}`;
                const isBooked = Boolean(selectedSlots[slotId]);

                return (
                  <div key={slotId} className="time-slot-item">
                    <span className="time-slot-label">{slot}</span>
                    <button
                      onClick={() => toggleBooking(slotId, machine.name, machine.type)}
                      className="time-slot-button"
                      style={{
                        backgroundColor: isBooked ? '#ef4444' : '#22c55e',
                        color: '#ffffff',
                        borderColor: isBooked ? '#dc2626' : '#16a34a',
                      }}
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
          {weekBookings.map(booking => {
            const bookingDate = booking.date instanceof Date 
              ? booking.date 
              : new Date(booking.date);

            return (
              <li key={booking._id}>
                {booking.machine} ({booking.machineType}) - {bookingDate.toDateString()} {booking.dayName}
                <button onClick={() => handleUnbook(booking._id)}>Cancel</button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default LaundryBookingPage;
