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
  handleUnbook,
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
      {/* Home Button */}
      <div className="home-header">
        <button className="home-button" onClick={() => navigate('/')}>Home</button>
      </div>

      {/* Page Heading */}
      <h1>Schedule for {selectedDay.dayName}, {selectedDay.date.toDateString()}</h1>

      {/* Machine Schedules */}
      {machines.map(machine => (
        <div key={machine.name} className="machine-schedule">
          <h3
            onClick={() => toggleMachineOpen(machine.name)}
          >
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
          {weekBookings.map(booking => (
            <li key={booking.id}>
              {booking.machine} ({booking.machineType}) - {booking.date.toDateString()} {booking.dayName}
              <button onClick={() => handleUnbook(selectedWeekKey, booking.id)}>Cancel</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LaundryBookingPage;
