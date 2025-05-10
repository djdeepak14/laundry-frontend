import MachineBookingCard from './MachineBookingCard'; // Ensure correct path

const SelectedDaySchedule = ({
  selectedDay,
  currentMonth,
  currentYear,
  timeSlots,
  machines,
  selectedSlots,
  bookings,
  selectedWeekKey,
  setSelectedSlots,
  toggleBooking,
  isSlotDisabled,
  months  // Receiving months as a prop
}) => (
  <div className="schedule flex-grow flex items-center justify-center mb-6">
    <div className="day-section w-full max-w-5xl">
      <h2 className="day-header text-xl font-semibold mb-4 text-center">
        {`${selectedDay.dayName}, ${months[currentMonth]} ${selectedDay.date.getDate()}, ${currentYear}`}
      </h2>
      <div className="machine-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {machines.map((machine) => {
          const slotId = `${selectedDay.dayName}-${machine.name}`;
          const selectedTime = selectedSlots[slotId] || '';

          return (
            <MachineBookingCard
              key={machine.name}
              machine={machine}
              selectedDay={selectedDay}
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              selectedWeekKey={selectedWeekKey}
              bookings={bookings}
              onTimeChange={(e) => setSelectedSlots((prev) => ({ ...prev, [slotId]: e.target.value }))}
              onToggleBooking={toggleBooking}
              isSlotDisabled={isSlotDisabled}
            />
          );
        })}
      </div>
    </div>
  </div>
);

export default SelectedDaySchedule;
