import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from './CalendarGrid';
import BookedMachinesList from './BookedMachinesList';
import CalendarHeader from './CalendarHeader';
import MachineBookingCard from './MachineBookingCard';
import logo from '../assets/Sevas.png';

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

  // State for live date and time
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000); // update every second

    return () => clearInterval(timer); // cleanup
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="container">
      {/* Logo and Titles Centered */}
      <div className="landing-center">
        <img src={logo} alt="Sevas Laundry Logo" className="landing-logo" />
        <h1 className="app-title">Sevas Laundry Booking</h1>
        <p className="current-date-time">
          <span className="date">{currentDate.toLocaleDateString()}</span>
          <br />
          <span className="time">{currentDate.toLocaleTimeString()}</span>
        </p>
      </div>

      {/* Home + Book Laundry Buttons Centered */}
      <div className="home-laundry-buttons">
        <button className="home-button" onClick={() => navigate('/')}>
          Home
        </button>
        <button className="book-laundry-button" onClick={() => navigate('/laundry')}>
          Book Laundry
        </button>
      </div>

      {/* Calendar Header with Month + Prev/Next */}
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
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onDayClick={(day) => {
          handleDayClick(day);
          navigate('/laundry');
        }}
      />

      {/* Week Bookings */}
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
