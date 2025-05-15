import React, { useState, useEffect } from 'react';
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

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
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
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState(() => JSON.parse(localStorage.getItem('sevasBookings') || '{}'));
  const [selectedSlots, setSelectedSlots] = useState(() => JSON.parse(localStorage.getItem('sevasSelectedSlots') || '{}'));

  const [isLoggedIn, setIsLoggedIn] = useState(false); // new state for login status
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sevasBookings', JSON.stringify(bookings));
    localStorage.setItem('sevasSelectedSlots', JSON.stringify(selectedSlots));
  }, [bookings, selectedSlots]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate("/"); // redirect to homepage after login
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 8}:00 - ${i + 9}:00`);

  const handleMonthChange = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    else if (newMonth > 11) { newMonth = 0; newYear += 1; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDay({ date, dayName: weekdays[date.getDay()] });
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  };

  const getWeekBookingStats = (weekKey) => {
    const weekBookings = bookings[weekKey] || [];
    const totalBookings = weekBookings.length;
    const dryerCount = weekBookings.filter(b => b.machineType === 'dryer').length;
    return { totalBookings, dryerCount };
  };

  const toggleBooking = (slotId, machine, machineType) => {
    if (!selectedDay) return;

    const weekKey = getWeekKey(selectedDay.date);
    const weekBookings = bookings[weekKey] || [];
    const isBooked = weekBookings.some(b => b.id === slotId);
    const { totalBookings, dryerCount } = getWeekBookingStats(weekKey);

    if (isBooked) {
      setBookings(prev => ({
        ...prev,
        [weekKey]: prev[weekKey].filter(b => b.id !== slotId)
      }));
      setSelectedSlots(prev => ({ ...prev, [slotId]: false }));
    } else {
      if (totalBookings >= 2) {
        alert("You can only book a maximum of 2 machines per week.");
        return;
      }
      if (machineType === 'dryer' && dryerCount >= 2) {
        alert("You can only book a maximum of 2 dryers per week.");
        return;
      }
      setBookings(prev => ({
        ...prev,
        [weekKey]: [...weekBookings, {
          id: slotId,
          machine,
          machineType,
          dayName: selectedDay.dayName,
          date: selectedDay.date
        }]
      }));
      setSelectedSlots(prev => ({ ...prev, [slotId]: true }));
    }
  };

  const isSlotDisabled = (slotId) => Boolean(selectedSlots[slotId]);
  const selectedWeekKey = selectedDay ? getWeekKey(selectedDay.date) : null;
  const weekBookings = bookings[selectedWeekKey] || [];

  // If not logged in and trying to access "/", redirect to /login
  // Also redirect from "/" to "/home" after login
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
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              bookings={bookings}
              selectedWeekKey={selectedWeekKey}
              weekBookings={weekBookings}
              handleDayClick={handleDayClick}
              handleMonthChange={handleMonthChange}
              toggleBooking={toggleBooking}
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
              selectedDay={selectedDay}
              machines={machines}
              timeSlots={timeSlots}
              selectedSlots={selectedSlots}
              toggleBooking={toggleBooking}
              isSlotDisabled={isSlotDisabled}
              weekBookings={weekBookings}
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
