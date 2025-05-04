import React, { useState } from 'react';
import './App.css';

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const machines = ["Washer 1", "Washer 2", "Dryer 1", "Dryer 2"];

// Dynamic time slot generation
const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour}:00`);
  }
  return slots;
};

const App = () => {
  const [selected, setSelected] = useState([]);
  const timeSlots = generateTimeSlots(8, 22);

  const toggleSelect = (id) => {
    const machine = id.split('-')[2]; // Extract machine from id (day-time-machine)
    const isWasher = machine.includes("Washer");
    const isDryer = machine.includes("Dryer");

    setSelected(prev => {
      // If already selected, remove it
      if (prev.includes(id)) {
        return prev.filter(slot => slot !== id);
      }

      // Count current washers and dryers
      const hasWasher = prev.some(slot => slot.includes("Washer"));
      const hasDryer = prev.some(slot => slot.includes("Dryer"));

      // Enforce rules: max 2 selections, must be one washer and one dryer
      if (prev.length >= 2) {
        return prev; // Can't add more than 2
      }
      if (isWasher && hasWasher) {
        return prev; // Can't add another washer
      }
      if (isDryer && hasDryer) {
        return prev; // Can't add another dryer
      }

      return [...prev, id];
    });
  };

  return (
    <div className="container">
      <img src="/sevas.png" alt="Sevas Logo" className="logo" />
      <h1 className="heading">Sevas Online Laundry Booking System</h1>

      <div className="schedule">
        {weekdays.map(day => (
          <div key={day} className="day-section">
            <h2 className="day-header">{day}</h2>
            <div className="machine-grid">
              {machines.map(machine => (
                <div key={machine} className="machine-column">
                  <div className="machine-label">{machine}</div>
                  <div className="time-scroll">
                    {timeSlots.map(time => {
                      const id = `${day}-${time}-${machine}`;
                      return (
                        <button
                          key={id}
                          className={`time-slot ${selected.includes(id) ? 'selected' : ''}`}
                          onClick={() => toggleSelect(id)}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;