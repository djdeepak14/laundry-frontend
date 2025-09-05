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
  weekBookings = [],
  handleDayClick,
  handleMonthChange,
  toggleBooking,
  handleUnbook,
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
      {/* Logo */}
      <LogoHeader />

      {/* Buttons above the calendar */}
      <div className="home-laundry-buttons">
        <button className="home-button" onClick={() => navigate('/')}>Home</button>
        <button className="book-laundry-button" onClick={() => navigate('/laundry')}>Book Laundry</button>
      </div>

      {/* Month Heading */}
      <h1>{months[currentMonth]} {currentYear}</h1>

      {/* Month Navigation */}
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        months={months}
        onChange={handleMonthChange}
      />

      {/* Calendar Grid */}
      <CalendarGrid
        weekdays={weekdays}
        calendarDays={calendarCells}
        today={today}
        selectedDay={selectedDay}  // selectedDay is a number like 15
        currentMonth={currentMonth}
        currentYear={currentYear}
        onDayClick={(day) => {
          handleDayClick(day);     // day is a number like 15
          navigate('/laundry');
        }}
      />

      {/* Week Bookings Cards */}
      {weekBookings.length > 0 && (
        <div className="week-bookings-cards">
          {weekBookings.map((b) => (
            <MachineBookingCard
              key={b.id}
              booking={b}
              onUnbook={() => handleUnbook(selectedWeekKey, b.id)}
            />
          ))}
        </div>
      )}

      {/* Booked Machines List */}
      <BookedMachinesList
        weekBookings={weekBookings}
        selectedWeekKey={selectedWeekKey}
        handleUnbook={handleUnbook}
      />
    </div>
  );
};

export default HomePage;
