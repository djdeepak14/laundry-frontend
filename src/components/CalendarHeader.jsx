import React from 'react';

const CalendarHeader = ({ currentMonth, currentYear, months, onChange }) => {
  return (
    <div className="calendar-header-container">
      <button
        className="nav-button"
        onClick={() => onChange(-1)}
      >
        Previous
      </button>

      <div className="calendar-month-year">
        {months[currentMonth]} {currentYear}
      </div>

      <button
        className="nav-button"
        onClick={() => onChange(1)}
      >
        Next
      </button>
    </div>
  );
};

export default CalendarHeader;
