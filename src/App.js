import React, { useState, useEffect } from 'react';
import './App.css';

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const machines = ["Washer 1", "Washer 2", "Dryer 1", "Dryer 2"];

const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour}:00 - ${hour + 1}:00`);
  }
  return slots;
};

const App = () => {
  const [selected, setSelected] = useState([]); // booked slots
  const [timers, setTimers] = useState({});
  const [washerCount, setWasherCount] = useState(0); // Track number of washers booked
  const [dryerCount, setDryerCount] = useState(0); // Track number of dryers booked
  const [selectedSlots, setSelectedSlots] = useState({}); // Track selected dropdown values

  const timeSlots = generateTimeSlots(8, 22); // Generate time slots from 8 AM to 10 PM

  const isWasher = (machine) => machine.includes("Washer");
  const isDryer = (machine) => machine.includes("Dryer");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        for (const id in updated) {
          if (updated[id] > 0) {
            updated[id] -= 1;
          } else {
            delete updated[id];
            setSelected((prevSel) => prevSel.filter((slot) => slot !== id));
            if (id.includes("Washer")) {
              setWasherCount((count) => count - 1);
            } else if (id.includes("Dryer")) {
              setDryerCount((count) => count - 1);
            }
          }
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSlotChange = (id, value) => {
    setSelectedSlots((prev) => ({ ...prev, [id]: value }));
  };

  const toggleBooking = (id, action) => {
    const [day, time, machine] = id.split('-');
    const hourStart = parseInt(time.split(':')[0]);

    const isWasherMachine = isWasher(machine);
    const isDryerMachine = isDryer(machine);
    const washerIndex = machines.indexOf(machine);

    if (!isWasherMachine && isDryerMachine && action === 'book') {
      alert("Dryers are automatically booked with washers.");
      return;
    }

    const dryerMachine = `Dryer ${washerIndex + 1}`;
    const dryerTime = `${hourStart + 1}:00 - ${hourStart + 2}:00`;
    const dryerId = `${day}-${dryerTime}-${dryerMachine}`;

    const isAlreadySelected = selected.includes(id);

    if (action === 'unbook' && isAlreadySelected) {
      // Unbook both washer and dryer
      setSelected((prev) => prev.filter((slot) => slot !== id && slot !== dryerId));
      setTimers((prev) => {
        const updated = { ...prev };
        delete updated[id];
        delete updated[dryerId];
        return updated;
      });
      if (isWasherMachine) {
        setWasherCount((count) => count - 1);
        setDryerCount((count) => count - 1); // Also decrease dryer count since it was auto-booked
      }
      setSelectedSlots((prev) => ({ ...prev, [`${day}-${machine}`]: '' }));
      return;
    }

    if (action === 'book' && isWasherMachine && !isAlreadySelected) {
      if (washerCount >= 2) {
        alert("You can only book 2 washers per week.");
        return;
      }
      if (dryerCount >= 2) {
        alert("You can only book 2 dryers per week.");
        return;
      }

      // Book washer and corresponding dryer
      setSelected((prev) => [...prev, id, dryerId]);
      setTimers((prev) => ({
        ...prev,
        [id]: 3600, // Set timer for 1 hour (3600 seconds)
        [dryerId]: 3600,
      }));
      setWasherCount((count) => count + 1);
      setDryerCount((count) => count + 1);
    }
  };

  const isSlotDisabled = (id, machine) => {
    const isDryerMachine = isDryer(machine);
    if (isDryerMachine) {
      const [day, time, dryerMachine] = id.split('-');
      const washerMachine = dryerMachine.replace("Dryer", "Washer");
      const washerId = `${day}-${time}-${washerMachine}`;
      return selected.includes(washerId); // Disable dryer if the corresponding washer is selected
    }

    const isSelected = selected.includes(id);
    return (washerCount >= 2 && isWasher(machine) && !isSelected) || 
           (dryerCount >= 2 && isDryer(machine) && !isSelected);
  };

  return (
    <div className="container">
      <img src="/sevas.png" alt="Sevas Logo" className="logo" />
      <h1 className="heading">Sevas Online Laundry Booking System</h1>

      <div className="schedule">
        {weekdays.map((day) => (
          <div key={day} className="day-section">
            <h2 className="day-header">{day}</h2>
            <div className="machine-grid">
              {machines.map((machine) => (
                <div key={machine} className="machine-column">
                  <div className="machine-label">{machine}</div>
                  <div className="time-scroll">
                    <div className="dropdown-container">
                      <label htmlFor={`time-select-${day}-${machine}`}>Select Time Slot:</label>
                      <select
                        id={`time-select-${day}-${machine}`}
                        value={selectedSlots[`${day}-${machine}`] || ''}
                        onChange={(e) => handleSlotChange(`${day}-${machine}`, e.target.value)}
                        disabled={(washerCount >= 2 && isWasher(machine)) || (dryerCount >= 2 && isDryer(machine))}
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map((slot) => (
                          <option
                            key={slot}
                            value={slot}
                            disabled={isSlotDisabled(`${day}-${slot}-${machine}`, machine)}
                          >
                            {slot}
                          </option>
                        ))}
                      </select>
                      <div className="button-group">
                        <button
                          onClick={() => toggleBooking(`${day}-${selectedSlots[`${day}-${machine}`]}-${machine}`, 'book')}
                          disabled={!selectedSlots[`${day}-${machine}`] || selected.includes(`${day}-${selectedSlots[`${day}-${machine}`]}-${machine}`)}
                        >
                          Book
                        </button>
                        <button
                          onClick={() => toggleBooking(`${day}-${selectedSlots[`${day}-${machine}`]}-${machine}`, 'unbook')}
                          disabled={!selected.includes(`${day}-${selectedSlots[`${day}-${machine}`]}-${machine}`)}
                        >
                          Unbook
                        </button>
                      </div>
                    </div>

                    {selected.some((slot) => slot.includes(`${day}-${machine}`)) && (
                      <div className="timer">
                        {selected
                          .filter((slot) => slot.includes(`${day}-${machine}`))
                          .map((slot) => (
                            <div key={slot}>{formatTime(timers[slot])}</div>
                          ))}
                      </div>
                    )}
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