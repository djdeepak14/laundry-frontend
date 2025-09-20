import React, { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./App.css";
import AdminDashboard from './pages/AdminDashboard';

import HomePage from "./components/HomePage";
import LaundryBookingPage from "./components/LaundryBookingPage";
import LoginForm from "./components/LoginForm";

import {
  getBookings,
  createBooking,
  deleteBooking,
} from "./api";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const machines = [
  { name: "Washer1", type: "washer" },
  { name: "Washer2", type: "washer" },
  { name: "Dryer1", type: "dryer" },
  { name: "Dryer2", type: "dryer" },
];

const MAX_WEEKLY_BOOKINGS = { washer: 2, dryer: 2 };

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const AppRoutes = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate();

  const effectiveSelectedDay = selectedDay || {
    date: today,
    day: today.getDate(),
    dayName: weekdays[today.getDay()],
  };

  const getWeekKey = (date) => {
    const year = date.getFullYear();
    const weekNum = getWeekNumber(date);
    return `${year}-W${String(weekNum).padStart(2, "0")}`;
  };

  const getWeekBookingStats = (weekKey) => {
    const weekBookings = bookings[weekKey] || [];
    const washerCount = weekBookings.filter((b) => b.machineType === "washer").length;
    const dryerCount = weekBookings.filter((b) => b.machineType === "dryer").length;
    return { totalBookings: weekBookings.length, washerCount, dryerCount };
  };

  // ---------------------
  // Fetch bookings from backend
  // ---------------------
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const data = await getBookings(token);
        const updatedBookings = {};
        const updatedSelectedSlots = {};

        data.forEach((booking) => {
          const weekKey = getWeekKey(new Date(booking.date));
          if (!updatedBookings[weekKey]) updatedBookings[weekKey] = [];
          updatedBookings[weekKey].push(booking);
          updatedSelectedSlots[booking.slotId] = true;
        });

        setBookings(updatedBookings);
        setSelectedSlots(updatedSelectedSlots);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          (err.code === "ECONNABORTED"
            ? "Request timed out. Please try again."
            : err.message || "Failed to fetch bookings");

        console.error("Fetch bookings error:", message);

        if (err.response?.status === 401) {
          setIsLoggedIn(false);
          setToken(null);
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert(message);
        }
      }
    };

    fetchData();
  }, [token, navigate]);

  // ---------------------
  // Auth helpers
  // ---------------------
  const handleLoginSuccess = async (token, userId) => {
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    setIsLoggedIn(true);
    navigate("/");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // ---------------------
  // Calendar navigation
  // ---------------------
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

  // ---------------------
  // Book / Unbook toggle
  // ---------------------
  const toggleBooking = async (slotId, machine, machineType) => {
    if (!effectiveSelectedDay || !token) return;

    const weekKey = getWeekKey(effectiveSelectedDay.date);
    const weekBookings = bookings[weekKey] || [];
    const isBooked = weekBookings.some((b) => b.slotId === slotId);
    const { washerCount, dryerCount } = getWeekBookingStats(weekKey);

    if (isBooked) {
      const booking = weekBookings.find((b) => b.slotId === slotId);
      if (booking) {
        try {
          await deleteBooking(booking._id, token);
          setBookings((prev) => ({
            ...prev,
            [weekKey]: prev[weekKey].filter((b) => b.slotId !== slotId),
          }));
          setSelectedSlots((prev) => {
            const updated = { ...prev };
            delete updated[slotId];
            return updated;
          });
        } catch (err) {
          const message =
            err.response?.data?.message ||
            (err.code === "ECONNABORTED"
              ? "Request timed out. Please try again."
              : err.message || "Failed to cancel booking");

          console.error("Delete booking error:", message);
          alert(message);
        }
      }
    } else {
      if (machineType === "washer" && washerCount >= MAX_WEEKLY_BOOKINGS.washer) {
        alert("You can only book 2 washers per week.");
        return;
      }
      if (machineType === "dryer" && dryerCount >= MAX_WEEKLY_BOOKINGS.dryer) {
        alert("You can only book 2 dryers per week.");
        return;
      }

      const newBooking = {
        slotId,
        machine,
        machineType,
        dayName: effectiveSelectedDay.dayName,
        date: effectiveSelectedDay.date,
        timeSlot: slotId.split("_").pop(),
        timestamp: new Date().toISOString(),
      };

      try {
        const saved = await createBooking(newBooking, token);
        setBookings((prev) => ({
          ...prev,
          [weekKey]: [...weekBookings, saved],
        }));
        setSelectedSlots((prev) => ({ ...prev, [slotId]: true }));
      } catch (err) {
        const message =
          err.response?.data?.message ||
          (err.code === "ECONNABORTED"
            ? "Request timed out. Please try again."
            : err.message || "Failed to create booking");

        console.error("Create booking error:", message);
        alert(message);
      }
    }
  };

  // ---------------------
  // Unbook by ID
  // ---------------------
  const handleUnbook = async (bookingId) => {
    if (!token || !bookingId) return;

    try {
      await deleteBooking(bookingId, token);
      setBookings((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((weekKey) => {
          updated[weekKey] = updated[weekKey].filter((b) => b._id !== bookingId);
        });
        return updated;
      });
      setSelectedSlots((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((slotId) => {
          if (slotId.includes(bookingId)) delete updated[slotId];
        });
        return updated;
      });
      alert("Booking cancelled successfully!");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : err.message || "Failed to cancel booking");

      console.error("Delete booking error:", message);
      alert(message);
    }
  };

  // ---------------------
  // Derived state
  // ---------------------
  const selectedWeekKey = getWeekKey(effectiveSelectedDay.date);
  const weekBookings = bookings[selectedWeekKey] || [];
  const timeSlots = useMemo(
    () => Array.from({ length: 14 }, (_, i) => `${i + 8}:00 - ${i + 9}:00`),
    []
  );

  // ---------------------
  // Routes
  // ---------------------
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
              selectedDay={effectiveSelectedDay.day}
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
              handleLogout={handleLogout}
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
      <Route
        path="/register"
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} /> 
          )
        }
      />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
};

const App = () => <AppRoutes />;

export default App;
