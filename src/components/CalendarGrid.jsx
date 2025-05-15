// components/CalendarGrid.js
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
    <div className="calendar-grid">
      {weekdays.map((weekday, index) => (
        <div
          key={`weekday-${index}`}
          className="weekday-header"
        >
          {weekday}
        </div>
      ))}
      {calendarDays.map((day, index) => {
        const isToday =
          day &&
          today.getDate() === day &&
          today.getMonth() === currentMonth &&
          today.getFullYear() === currentYear;
        const isSelected =
          selectedDay &&
          selectedDay.date.getDate() === day &&
          selectedDay.date.getMonth() === currentMonth &&
          selectedDay.date.getFullYear() === currentYear;

        return (
          <div
            key={`day-${index}`}
            className={`day-cell ${day ? 'active-day' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => day && onDayClick(day)}
          >
            {day || ''}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarGrid;