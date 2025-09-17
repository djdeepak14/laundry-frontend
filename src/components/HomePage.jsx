import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
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

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const monthShortNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  months = [],
  weekdays = [],
  handleLogout,
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <ErrorBoundary>
      <div className="container flex flex-col items-center m-4">
        {/* Logo + Current Date/Time */}
        <div className="landing-center mb-4 text-center">
          <img src={logo} alt="Sevas Laundry Logo" className="landing-logo mb-2" />
          <h1 className="app-title mb-1">Sevas Laundry Booking</h1>
          <p className="current-date-time text-gray-700">
            <span className="date">{currentDate.toLocaleDateString()}</span>
            <br />
            <span className="time">{currentDate.toLocaleTimeString()}</span>
          </p>
        </div>

        {/* Booked Laundry Box */}
        <div className="booked-laundry-box bg-white rounded-xl shadow p-4 w-full max-w-md mb-4">
          <h2 className="text-lg font-bold mb-3 border-b pb-1">Booked Laundry</h2>
          {weekBookings.length === 0 ? (
            <p className="text-gray-500">No bookings this week.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-sm text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Date</th>
                  <th className="border border-gray-300 px-2 py-1">Day</th>
                  <th className="border border-gray-300 px-2 py-1">Machine</th>
                </tr>
              </thead>
              <tbody>
                {weekBookings.map((b) => {
                  const dateObj = new Date(b.date);
                  const shortMonth = monthShortNames[dateObj.getMonth()];
                  const dayNum = dateObj.getDate();
                  return (
                    <tr key={b.id || b._id || b.slotId} className="bg-blue-50">
                      <td className="border border-gray-300 px-2 py-1">{shortMonth} {dayNum}</td>
                      <td className="border border-gray-300 px-2 py-1">{b.dayName}</td>
                      <td className="border border-gray-300 px-2 py-1">{b.machine}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Buttons */}
        <div className="home-laundry-buttons mb-4">
          <button className="home-button mr-2" onClick={() => navigate('/')}>Home</button>
          <button className="book-laundry-button mr-2" onClick={() => navigate('/laundry')}>Book Laundry</button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={() => {
              if (typeof handleLogout === 'function') handleLogout();
              else navigate('/login', { replace: true });
            }}
          >
            Logout
          </button>
        </div>

        {/* Calendar Header */}
        {months.length > 0 && handleMonthChange && (
          <CalendarHeader
            currentMonth={currentMonth}
            currentYear={currentYear}
            months={months}
            onChange={handleMonthChange}
          />
        )}

        {/* Calendar Grid */}
        {weekdays.length > 0 && handleDayClick && (
          <CalendarGrid
            weekdays={weekdays}
            calendarDays={calendarCells}
            today={today}
            selectedDay={selectedDay}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onDayClick={(day) => handleDayClick(day)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default HomePage;
