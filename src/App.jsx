import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import HomePage from "./components/HomePage";
import LaundryBookingPage from "./components/LaundryBookingPage";
import LoginForm from "./components/LoginForm";
import { getBookings, createBooking, cancelBooking } from "./api";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ✅ Fixed machine list with valid MongoDB-like ObjectIds
const machines = [
  { _id: "652a61a27f6b3cc934ea3001", name: "Washer 1", type: "washer" },
  { _id: "652a61a27f6b3cc934ea3002", name: "Washer 2", type: "washer" },
  { _id: "652a61a27f6b3cc934ea3003", name: "Dryer 1", type: "dryer" },
  { _id: "652a61a27f6b3cc934ea3004", name: "Dryer 2", type: "dryer" },
];

const MAX_WEEKLY_BOOKINGS = { washer: 2, dryer: 2 };

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const App = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const effectiveSelectedDay = selectedDay || {
    date: today,
    day: today.getDate(),
    dayName: weekdays[today.getDay()],
  };

  const getWeekKey = (date) =>
    `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, "0")}`;

  const getWeekBookingStats = (weekKey) => {
    const weekBookings = bookings[weekKey] || [];
    const washerCount = weekBookings.filter((b) => b.machineType === "washer").length;
    const dryerCount = weekBookings.filter((b) => b.machineType === "dryer").length;
    return { washerCount, dryerCount };
  };

  // ✅ Fetch user bookings when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBookings();
        const updatedBookings = {};
        const updatedSelectedSlots = {};

        data.forEach((booking) => {
          const weekKey = getWeekKey(new Date(booking.start));
          if (!updatedBookings[weekKey]) updatedBookings[weekKey] = [];
          const slotId = `${booking.machine}_${new Date(booking.start).getHours()}`;
          updatedBookings[weekKey].push({ ...booking, slotId });
          updatedSelectedSlots[slotId] = true;
        });

        setBookings(updatedBookings);
        setSelectedSlots(updatedSelectedSlots);
      } catch (err) {
        setError("Failed to fetch bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn]);

  const handleLoginSuccess = (token, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    setIsLoggedIn(true);
    navigate("/");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
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

  // ✅ Booking / Unbooking logic
  const toggleBooking = async (slotId, machineName, machineType) => {
    const weekKey = getWeekKey(effectiveSelectedDay.date);
    const weekBookings = bookings[weekKey] || [];
    const { washerCount, dryerCount } = getWeekBookingStats(weekKey);
    const isBooked = weekBookings.some((b) => b.slotId === slotId);

    if (isBooked) {
      const booking = weekBookings.find((b) => b.slotId === slotId);
      if (!booking) return;
      try {
        await cancelBooking(booking._id);
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
        setError("Failed to cancel booking. Please try again.");
      }
      return;
    }

    if (machineType === "washer" && washerCount >= MAX_WEEKLY_BOOKINGS.washer) {
      setError("You can only book 2 washers per week.");
      return;
    }
    if (machineType === "dryer" && dryerCount >= MAX_WEEKLY_BOOKINGS.dryer) {
      setError("You can only book 2 dryers per week.");
      return;
    }

    const startHour = Number(slotId.split("_").pop());
    const start = new Date(effectiveSelectedDay.date);
    start.setHours(startHour, 0, 0, 0);

    const machine = machines.find((m) => m.name === machineName);
    if (!machine || !machine._id) {
      setError("Machine not found");
      return;
    }

    try {
      const saved = await createBooking({ machineId: machine._id, start });
      const newSlotId = `${machineName}_${startHour}`;
      setBookings((prev) => ({
        ...prev,
        [weekKey]: [...weekBookings, { ...saved, slotId: newSlotId }],
      }));
      setSelectedSlots((prev) => ({ ...prev, [newSlotId]: true }));
    } catch (err) {
      setError("Failed to create booking. Please try again.");
    }
  };

  const handleUnbook = async (bookingId) => {
    if (!bookingId) return;
    try {
      await cancelBooking(bookingId);
      setBookings((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((weekKey) => {
          updated[weekKey] = updated[weekKey].filter((b) => b._id !== bookingId);
        });
        return updated;
      });
      setError(null);
    } catch (err) {
      setError("Failed to cancel booking. Please try again.");
    }
  };

  const selectedWeekKey = getWeekKey(effectiveSelectedDay.date);
  const weekBookings = bookings[selectedWeekKey] || [];
  const timeSlots = useMemo(
    () => Array.from({ length: 14 }, (_, i) => `${i + 8}:00 - ${i + 9}:00`),
    []
  );

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

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
      </Routes>
    </>
  );
};

export default App;
