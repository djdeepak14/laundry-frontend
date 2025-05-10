const CalendarGrid = ({ days, weekdays, selectedDay, today, onDayClick }) => (
    <div className="calendar-grid grid grid-cols-7 gap-1">
      {weekdays.map((day) => (
        <div key={day} className="calendar-day-header text-center font-semibold p-2 bg-gray-200">{day}</div>
      ))}
      {days.map((day, index) => {
        const isToday = day && today.getDate() === day;
        const isSelected = day && selectedDay?.date.getDate() === day;
        return (
          <div
            key={index}
            onClick={day ? () => onDayClick(day) : null}
            className={`calendar-day p-2 text-center border rounded-md ${
              day
                ? isToday ? 'bg-green-500 text-white'
                : isSelected ? 'bg-blue-500 text-white'
                : 'bg-white hover:bg-gray-100 cursor-pointer'
                : 'bg-gray-100'
            }`}
          >
            {day || ''}
          </div>
        );
      })}
    </div>
  );
  
  export default CalendarGrid;
  