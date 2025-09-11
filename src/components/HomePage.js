
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from './CalendarGrid';
import BookedMachinesList from './BookedMachinesList';
import CalendarHeader from './CalendarHeader';
import MachineBookingCard from './MachineBookingCard';
import logo from '../assets/Sevas.png';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      console.error('HomePage ErrorBoundary caught:', this.state.error);
      return (
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <h2>Error rendering component. Please check the console or try logging out.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

const getDaysInMonth = (year, month) => {
  if (typeof year !== 'number' || typeof month !== 'number') {
    console.error('Invalid year or month:', { year, month });
    return 30; // Fallback
  }
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  if (typeof year !== 'number' || typeof month !== 'number') {
    console.error('Invalid year or month:', { year, month });
    return 0; // Fallback
  }
  return new Date(year, month, 1).getDay();
};

const HomePage = ({
  today,
  currentMonth,
  currentYear,
  setCurrentMonth,
  setCurrentYear,
  selectedDay,
  setSelectedDay,
  bookings = {},
  selectedWeekKey,
  weekBookings = [],
  handleDayClick,
  handleMonthChange,
  toggleBooking,
  handleUnbook,
  months = [],
  weekdays = [],
  handleLogout,
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    console.log('HomePage.jsx: Mounting component');
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => {
      console.log('HomePage.jsx: Unmounting component');
      clearInterval(timer);
    };
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  console.log('HomePage.jsx: Render props:', {
    handleLogout: typeof handleLogout,
    currentMonth,
    currentYear,
    weekBookings: weekBookings.length,
    calendarCells: calendarCells.length,
    today,
    selectedDay,
    bookings: Object.keys(bookings).length,
    selectedWeekKey,
  });

  return (
    <ErrorBoundary>
      <div className="container">
        {/* Fallback Render */}
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <h1>Sevas Laundry Booking</h1>
          {weekBookings.length === 0 && <p>No bookings available. Try booking laundry or logging out.</p>}
        </div>

        {/* Logo and Titles */}
        <div className="landing-center">
          <img src={logo} alt="Sevas Laundry Logo" className="landing-logo" />
          <h1 className="app-title">Sevas Laundry Booking</h1>
          <p className="current-date-time">
            <span className="date">{currentDate.toLocaleDateString()}</span>
            <br />
            <span className="time">{currentDate.toLocaleTimeString()}</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="home-laundry-buttons">
          <button className="home-button" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="book-laundry-button" onClick={() => navigate('/laundry')}>
            Book Laundry
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={() => {
              console.log('HomePage.jsx: Logout button clicked');
              if (typeof handleLogout === 'function') {
                handleLogout();
              } else {
                console.error('HomePage.jsx: handleLogout is not a function');
                navigate('/login', { replace: true });
              }
            }}
          >
            Logout
          </button>
        </div>

        {/* Calendar Header */}
        {months.length > 0 && handleMonthChange ? (
          <ErrorBoundary>
            <CalendarHeader
              currentMonth={currentMonth}
              currentYear={currentYear}
              months={months}
              onChange={handleMonthChange}
            />
          </ErrorBoundary>
        ) : (
          <p>Calendar header unavailable.</p>
        )}

        {/* Calendar Grid */}
        {weekdays.length > 0 && handleDayClick ? (
          <ErrorBoundary>
            <CalendarGrid
              weekdays={weekdays}
              calendarDays={calendarCells}
              today={today}
              selectedDay={selectedDay}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onDayClick={(day) => {
                console.log('HomePage.jsx: Day clicked:', day);
                handleDayClick(day);
                navigate('/laundry');
              }}
            />
          </ErrorBoundary>
        ) : (
          <p>Calendar grid unavailable.</p>
        )}

        {/* Week Bookings */}
        {weekBookings.length > 0 ? (
          <div className="week-bookings-cards">
            <ErrorBoundary>
              {weekBookings.map((b) => (
                <MachineBookingCard
                  key={b.id || b.slotId}
                  booking={b}
                  onUnbook={() => {
                    console.log('HomePage.jsx: Unbooking:', b.id);
                    handleUnbook(selectedWeekKey, b.id);
                  }}
                />
              ))}
            </ErrorBoundary>
          </div>
        ) : (
          <p>No bookings for this week.</p>
        )}

        {/* Booked Machines List */}
        {handleUnbook ? (
          <ErrorBoundary>
            <BookedMachinesList
              weekBookings={weekBookings}
              selectedWeekKey={selectedWeekKey}
              handleUnbook={handleUnbook}
            />
          </ErrorBoundary>
        ) : (
          <p>Booked machines list unavailable.</p>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default HomePage;
