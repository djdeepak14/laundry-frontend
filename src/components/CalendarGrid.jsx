import React from 'react';

const CalendarGrid = ({
  weekdays,
  calendarDays,
  today,
  selectedDay,
  currentMonth,
  currentYear,
  onDayClick,
}) => {
  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {weekdays.map((day) => (
        <div key={day} className="font-bold p-2">
          {day}
        </div>
      ))}
      {calendarDays.map((day, index) => {
        const isToday =
          day &&
          today.getDate() === day &&
          today.getMonth() === currentMonth &&
          today.getFullYear() === currentYear;
        const isSelected =
          day &&
          selectedDay &&
          selectedDay.date.getDate() === day &&
          selectedDay.date.getMonth() === currentMonth &&
          selectedDay.date.getFullYear() === currentYear;

        return (
          <div
            key={index}
            onClick={() => day && onDayClick(day)}
            className={`p-2 border ${
              day
                ? isSelected
                  ? 'bg-blue-500 text-white'
                  : isToday
                  ? 'bg-yellow-200'
                  : 'hover:bg-gray-100'
                : 'bg-gray-50'
            } cursor-pointer`}
          >
            {day || ''}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;