

import React from 'react';

const CalendarHeader = ({ currentMonth, currentYear, months, onChange }) => {
  return (
    <div className="flex justify-between items-center my-4">
      <button onClick={() => onChange(-1)} className="px-4 py-2 bg-blue-500 text-white rounded">←</button>
      <h2 className="text-xl font-semibold">
        {months[currentMonth]} {currentYear}
      </h2>
      <button onClick={() => onChange(1)} className="px-4 py-2 bg-blue-500 text-white rounded">→</button>
    </div>
  );
};

export default CalendarHeader;
