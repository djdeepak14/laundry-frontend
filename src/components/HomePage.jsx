// src/components/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import { getBookings, getMachines } from '../api';
import { DateTime } from 'luxon';
import logo from '../assets/Sevas.png';
import '../App.css';

// === ERROR BOUNDARY ===
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      console.error('HomePage Error:', this.state.error);
      return (
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <h2>Error rendering component. Please check the console or try logging out.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

// === HELPER FUNCTIONS ===
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
  handleDayClick,
  handleMonthChange,
  months = [],
  weekdays = [],
  handleLogout,
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookedLaundry, setBookedLaundry] = useState([]);
  const [, setMachines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // === LIVE CLOCK ===
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === FETCH MACHINES & BOOKINGS ===
  const fetchBookedLaundry = useCallback(async (retries = 3) => {
    try {
      setLoading(true);
      setError('');

      // 1️⃣ Get all machines (to resolve IDs -> names)
      const machineResponse = await getMachines();
      const allMachines = (machineResponse?.data || machineResponse || []).map((m) => ({
        ...m,
        _id: m._id || m.id,
        name: m.name || m.code || 'Unnamed Machine',
        type: m.type || 'unknown',
      }));
      setMachines(allMachines);

      // 2️⃣ Fetch bookings
      const bookings = await getBookings();
      console.log('Fetched bookings for Home:', bookings);

      const formatted = (bookings || [])
        .filter((b) => b.status === 'booked')
        .map((b, index) => {
          const start = DateTime.fromISO(b.start, { zone: 'utc' });
          const end = DateTime.fromISO(b.end, { zone: 'utc' });

          // If populated, take directly; else match from machine list
          let machineName = 'Unknown Machine';
          let machineType = 'machine';
          const m = b.machine;
          if (typeof m === 'object' && m !== null) {
            machineName = m.name || m.code || 'Unknown Machine';
            machineType = m.type || 'machine';
          } else if (typeof m === 'string') {
            const found = allMachines.find((x) => x._id?.toString() === m.toString());
            if (found) {
              machineName = found.name;
              machineType = found.type;
            }
          }

          return {
            ...b,
            _id: b._id || `temp-${index}`,
            date: start.toFormat('yyyy-MM-dd'),
            shortMonth: start.toFormat('LLL'),
            dayNum: start.toFormat('dd'),
            time: `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`,
            machineName,
            machineType,
          };
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      setBookedLaundry(formatted);
    } catch (err) {
      if (retries > 0) {
        console.warn(`Retrying fetch bookings (${retries} attempts left)...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchBookedLaundry(retries - 1);
      }
      console.error('Failed to load bookings:', err);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookedLaundry();
  }, [fetchBookedLaundry]);

  // === CALENDAR SETUP ===
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <ErrorBoundary>
      <div className="container flex flex-col items-center m-4">
        {/* === LOGO + DATE/TIME === */}
        <div className="landing-center mb-4 text-center">
          <img src={logo} alt="Sevas Laundry Logo" className="landing-logo mb-2 w-24" />
          <h1 className="app-title mb-1 text-2xl font-bold">Sevas Laundry Booking</h1>
          <p className="current-date-time text-gray-700">
            <span className="date font-medium">{currentDate.toLocaleDateString()}</span>
            <br />
            <span className="time font-mono text-lg">{currentDate.toLocaleTimeString()}</span>
          </p>
        </div>

        {/* === BOOKED LAUNDRY BOX === */}
        <div className="booked-laundry-box bg-white rounded-xl shadow-lg p-5 w-full max-w-md mb-6">
          <h2 className="text-lg font-bold mb-3 border-b-2 border-blue-500 pb-1">Booked Laundry</h2>

          {loading && <p className="text-center text-gray-500">Loading your bookings...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && !error && bookedLaundry.length === 0 ? (
            <p className="text-gray-500">No bookings this week.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-6 py-2 min-w-[150px]">Date & Machine</th>
                    <th className="border border-gray-300 px-6 py-2 min-w-[120px]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedLaundry.map((b, i) => (
                    <tr key={b._id || i} className="bg-blue-50">
                      <td className="border border-gray-300 px-6 py-2">
                        {b.shortMonth} {b.dayNum}  {b.machineName}    ({b.machineType})
                      </td>
                      <td className="border border-gray-300 px-6 py-2 font-mono">{b.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* === ACTION BUTTONS === */}
        <div className="home-laundry-buttons flex gap-3 mb-6">
          <button
            className="home-button px-5 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => navigate('/')}
          >
            Home
          </button>
          <button
            className="book-laundry-button px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() =>
              navigate('/laundry', {
                state: {
                  selectedDay: {
                    dayName: DateTime.now().toFormat('cccc'),
                    date: new Date(),
                  },
                },
              })
            }
          >
            Book Laundry
          </button>
          <button
            className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
            onClick={() => {
              if (typeof handleLogout === 'function') handleLogout();
              else navigate('/login', { replace: true });
            }}
          >
            Logout
          </button>
        </div>

        {/* === CALENDAR HEADER === */}
        {months.length > 0 && handleMonthChange && (
          <CalendarHeader
            currentMonth={currentMonth}
            currentYear={currentYear}
            months={months}
            onChange={handleMonthChange}
          />
        )}

        {/* === CALENDAR GRID === */}
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
