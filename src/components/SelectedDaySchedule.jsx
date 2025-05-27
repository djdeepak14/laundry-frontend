import React from 'react';

const SelectedDaySchedule = ({
  selectedDay,
  machines,
  timeSlots,
  selectedSlots,
  toggleBooking,
  isSlotDisabled,
}) => {
  return (
    <div className="selected-day-schedule">
      <h2>Schedule for {selectedDay.dayName}, {new Date(selectedDay.date).toDateString()}</h2>
      {machines.map((machine) => (
        <div key={machine.name} className="machine-schedule">
          <h3>{machine.name} ({machine.type})</h3>
          <div className="time-slots-grid">
            {timeSlots.map((slot) => {
              const slotId = `${machine.name}-${slot}`;
              return (
                <div key={slotId} className="time-slot-item">
                  <span className="time-slot-label">{slot}</span>
                  <button
                    onClick={() => {
                      console.log('Calling toggleBooking with:', slotId, machine.name, machine.type);
                      toggleBooking(slotId, machine.name, machine.type);
                    }}
                    disabled={isSlotDisabled(slotId)}
                    className={`time-slot-button ${selectedSlots[slotId] ? 'selected' : ''}`}
                  >
                    {selectedSlots[slotId] ? 'Booked' : 'Book'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SelectedDaySchedule;
