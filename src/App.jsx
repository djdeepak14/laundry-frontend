import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';

import HomePage from './components/HomePage';
import LaundryBookingPage from './components/LaundryBookingPage';
import LoginForm from './components/LoginForm';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const machines = [
  { name: "Washer 1", type: "washer" },
  { name: "Washer 2", type: "washer" },
  { name: "Dryer 1", type: "dryer" },
  { name: "Dryer 2", type: "dryer" },
];

const MAX_WEEKLY_BOOKINGS = {
  washer: 2,
  dryer: 2,
};

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const AppRoutes = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  // selectedDay is an object: { date: Date, day: number, dayName: string }
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState(() => JSON.parse(localStorage.getItem('sevasBookings') || '{}'));
  const [selectedSlots, setSelectedSlots] = useState(() => JSON.parse(localStorage.getItem('sevasSelectedSlots') || '{}'));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Helper: get day number from selectedDay object or null
  const getSelectedDayNumber = (selDay) => {
    if (!selDay) return null;
    if (typeof selDay === 'number') return selDay;
    if (selDay.day) return selDay.day;
    return null;
  };

  // Use selectedDay or default today
  const effectiveSelectedDay = selectedDay || {
    date: today,
    day: today.getDate(),
    dayName: weekdays[today.getDay()],
  };

  useEffect(() => {
    const now = new Date();
    const updatedBookings = {};
    const updatedSelectedSlots = {};

    Object.entries(bookings).forEach(([weekKey, weekBookings]) => {
      const validBookings = weekBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= now;
      });

      if (validBookings.length > 0) {
        updatedBookings[weekKey] = validBookings;
        validBookings.forEach(booking => {
          updatedSelectedSlots[booking.id] = true;
        });
      }
    });

    setBookings(updatedBookings);
    setSelectedSlots(updatedSelectedSlots);
  }, []);

  useEffect(() => {
    localStorage.setItem('sevasBookings', JSON.stringify(bookings));
    localStorage.setItem('sevasSelectedSlots', JSON.stringify(selectedSlots));
  }, [bookings, selectedSlots]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/");
  };

  const handleMonthChange = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDay({ date, day, dayName: weekdays[date.getDay()] });
    navigate("/laundry");
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  };

  const getWeekBookingStats = (weekKey) => {
    const weekBookings = bookings[weekKey] || [];
    const washerCount = weekBookings.filter(b => b.machineType === 'washer').length;
    const dryerCount = weekBookings.filter(b => b.machineType === 'dryer').length;
    return { totalBookings: weekBookings.length, washerCount, dryerCount };
  };

  const toggleBooking = (slotId, machine, machineType) => {
    if (!effectiveSelectedDay) return;

    const weekKey = getWeekKey(effectiveSelectedDay.date);
    const weekBookings = bookings[weekKey] || [];
    const uniqueSlotId = `${effectiveSelectedDay.date.toDateString()}_${slotId}`;
    const isBooked = weekBookings.some(b => b.id === uniqueSlotId);
    const { washerCount, dryerCount } = getWeekBookingStats(weekKey);

    if (isBooked) {
      setBookings(prev => ({
        ...prev,
        [weekKey]: prev[weekKey].filter(b => b.id !== uniqueSlotId)
      }));
      setSelectedSlots(prev => {
        const updated = { ...prev };
        delete updated[uniqueSlotId];
        return updated;
      });
    } else {
      if (machineType === 'washer' && washerCount >= MAX_WEEKLY_BOOKINGS.washer) {
        alert("You can only book a maximum of 2 washers per week.");
        return;
      }
      if (machineType === 'dryer' && dryerCount >= MAX_WEEKLY_BOOKINGS.dryer) {
        alert("You can only book a maximum of 2 dryers per week.");
        return;
      }

      setBookings(prev => ({
        ...prev,
        [weekKey]: [...weekBookings, {
          id: uniqueSlotId,
          machine,
          machineType,
          dayName: effectiveSelectedDay.dayName,
          date: effectiveSelectedDay.date,
          timestamp: new Date().toISOString()
        }]
      }));

      setSelectedSlots(prev => ({ ...prev, [uniqueSlotId]: true }));
    }
  };

  const handleUnbook = (weekKey, bookingId) => {
    setBookings(prev => ({
      ...prev,
      [weekKey]: prev[weekKey]?.filter(b => b.id !== bookingId) || []
    }));

    setSelectedSlots(prev => {
      const updated = { ...prev };
      delete updated[bookingId];
      return updated;
    });
  };

  const isSlotDisabled = (slotId) => {
    const uniqueSlotId = `${effectiveSelectedDay.date.toDateString()}_${slotId}`;
    return Boolean(selectedSlots[uniqueSlotId]);
  };

  const selectedWeekKey = getWeekKey(effectiveSelectedDay.date);
  const weekBookings = bookings[selectedWeekKey] || [];

  const timeSlots = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => `${i + 8}:00 - ${i + 9}:00`)
  , []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <HomePage
              today={today}
              currentMonth={currentMonth}
              currentYear={currentYear}
              setCurrentMonth={setCurrentMonth}
              setCurrentYear={setCurrentYear}
              selectedDay={getSelectedDayNumber(effectiveSelectedDay)}  // Pass day number here
              setSelectedDay={setSelectedDay}
              bookings={bookings}
              selectedWeekKey={selectedWeekKey}
              weekBookings={weekBookings}
              handleDayClick={handleDayClick}
              handleMonthChange={handleMonthChange}
              toggleBooking={toggleBooking}
              handleUnbook={handleUnbook}
              months={months}
              weekdays={weekdays}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/laundry"
        element={
          isLoggedIn ? (
            <LaundryBookingPage
              selectedDay={effectiveSelectedDay}
              machines={machines}
              timeSlots={timeSlots}
              selectedSlots={selectedSlots}
              toggleBooking={toggleBooking}
              isSlotDisabled={isSlotDisabled}
              weekBookings={weekBookings}
              handleUnbook={handleUnbook}
              selectedWeekKey={selectedWeekKey}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
    </Routes>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
