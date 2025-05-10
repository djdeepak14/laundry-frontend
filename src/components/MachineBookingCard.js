import React from 'react';

const MachineBookingCard = ({
  machine,
  selectedDay,
  timeSlots,
  selectedTime,
  selectedWeekKey,
  bookings,
  onTimeChange,
  onToggleBooking,
  isSlotDisabled,
}) => {
  const slotId = `${selectedDay.dayName}-${machine.name}`;
  const bookingId = selectedTime ? `${selectedDay.dayName}-${selectedTime}-${machine.name}` : '';
  const isBooked = bookings[selectedWeekKey]?.some((b) => b.id === bookingId);

  // Disable the time selection when 4 slots are booked in the week, unless it's already booked
  const isTimeDisabled = bookings[selectedWeekKey]?.length >= 4 && !isBooked;

  return (
    <div className="machine-column bg-white p-4 rounded-lg">
      <div className="machine-label font-medium mb-2">{machine.name}</div>

      <label htmlFor={`time-select-${slotId}`} className="block text-sm font-medium mb-1">
        Select Time Slot:
      </label>

      <select
        id={`time-select-${slotId}`}
        value={selectedTime}
        onChange={onTimeChange}
        disabled={isTimeDisabled}
        className="w-full p-2 border rounded-md mb-2"
      >
        <option value="">Select Time</option>
        {timeSlots.map((slot) => (
          <option
            key={slot}
            value={slot}
            disabled={isSlotDisabled(`${selectedDay.dayName}-${slot}-${machine.name}`, machine.name, machine.type)}
          >
            {slot}
          </option>
        ))}
      </select>

      <button
        onClick={() => onToggleBooking(bookingId, machine.name, machine.type)}
        disabled={!selectedTime || isTimeDisabled}
        className={`w-full p-2 rounded-md text-white ${
          isBooked ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
      >
        {isBooked ? 'Unbook' : 'Book'}
      </button>
    </div>
  );
};

export default MachineBookingCard;
