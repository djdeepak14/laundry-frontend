// src/components/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from './CalendarGrid';
import BookedMachinesList from './BookedMachinesList';
import LogoHeader from './LogoHeader';
import CalendarHeader from './CalendarHeader';
import MachineBookingCard from './MachineBookingCard';

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const HomePage = ({
  today,
  currentMonth,
  currentYear,
  setCurrentMonth,
  setCurrentYear,
  selectedDay,
  setSelectedDay,
  bookings,
  selectedWeekKey,
  weekBookings,
  handleDayClick,
  handleMonthChange,
  toggleBooking,
  months,
  weekdays,
}) => {
  const navigate = useNavigate();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="container">
      <div className="home-header">
        <button onClick={() => navigate('/')} className="home-button">
          Home
        </button>
        <button onClick={() => navigate('/laundry')} className="home-button">
          Book Laundry
        </button>
      </div>
      <LogoHeader />
      <h1>{months[currentMonth]} {currentYear}</h1>
      
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        months={months}
        onChange={handleMonthChange}
      />

      <CalendarGrid
        weekdays={weekdays}
        calendarDays={calendarCells}
        today={today}
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onDayClick={(day) => {
          handleDayClick(day);
          navigate('/laundry');
        }}
      />

      {weekBookings.length > 0 && (
        <div>
          {weekBookings.map((b) => (
            <MachineBookingCard
              key={b.id}
              booking={b}
              onUnbook={() => toggleBooking(b.id, b.machine, b.machineType)}
            />
          ))}
        </div>
      )}

      <BookedMachinesList
        weekBookings={weekBookings}
        selectedWeekKey={selectedWeekKey}
        handleUnbook={(wk, id) => toggleBooking(id)}
      />
    </div>
  );
};

export default HomePage;