import React from 'react';

const SelectedDaySchedule = ({
  selectedDay,
  currentYear,
  currentMonth,
  machines,
  selectedSlots,
  setSelectedSlots,
  bookings,
  toggleBooking,
  isSlotDisabled,
  timeSlots,
  selectedWeekKey,
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-2">
        Schedule for {selectedDay.dayName}, {currentMonth + 1}/{selectedDay.date.getDate()}/{currentYear}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((machine) => (
          <div key={machine.name} className="p-4 bg-white border rounded">
            <h4 className="font-semibold mb-2">{machine.name}</h4>
            {timeSlots.map((slot) => {
              const id = `${selectedDay.date.getDate()}-${slot}-${machine.name}`;
              const isDisabled = isSlotDisabled(id, machine.name, machine.type);
              const isSelected = selectedSlots[`${selectedDay.date.getDate()}-${machine.name}`] === slot;

              return (
                <button
                  key={slot}
                  onClick={() => {
                    toggleBooking(id, machine.name, machine.type);
                    setSelectedSlots((prev) => ({
                      ...prev,
                      [`${selectedDay.date.getDate()}-${machine.name}`]: isSelected ? '' : slot,
                    }));
                  }}
                  disabled={isDisabled}
                  className={`w-full p-2 mb-2 text-left rounded ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isDisabled
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedDaySchedule;