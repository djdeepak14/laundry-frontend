// src/App.jsx   ←  REPLACE THIS ENTIRE FILE
import React, { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "./App.css";
import HomePage from "./components/HomePage";
import LaundryBookingPage from "./components/LaundryBookingPage";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./components/AdminDashboard";
import { getBookings, createBooking, cancelBooking } from "./api";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const machines = [
  { _id: "652a61a27f6b3cc934ea3001", name: "Washer 1", type: "washer" },
  { _id: "652a61a27f6b3cc934ea3002", name: "Washer 2", type: "washer" },
  { _id: "652a61a27f6b3cc934ea3003", name: "Dryer 1", type: "dryer" },
  { _id: "652a61a27f6b3cc934ea3004", name: "Dryer 2", type: "dryer" },
];

const MAX_WEEKLY_BOOKINGS = { washer: 2, dryer: 2 };

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(),0,1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const App = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  /* --------------------------------------------------------------
     1. READ localStorage on every render
     -------------------------------------------------------------- */
  const token   = localStorage.getItem("token");
  const role    = localStorage.getItem("role") || "user";
  const loggedIn = !!token;

  const [isLoggedIn, setIsLoggedIn] = useState(loggedIn);
  const [userRole,   setUserRole]   = useState(role);

  /* --------------------------------------------------------------
     2. **FORCE RE‑RENDER** when localStorage changes from console
     -------------------------------------------------------------- */
  useEffect(() => {
    const handler = () => {
      const newToken = localStorage.getItem("token");
      const newRole  = localStorage.getItem("role") || "user";
      setIsLoggedIn(!!newToken);
      setUserRole(newRole);
    };

    // listen for storage events (works across tabs) + manual poll
    window.addEventListener("storage", handler);
    const poll = setInterval(handler, 500);   // 0.5 s poll

    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(poll);
    };
  }, []);

  const effectiveSelectedDay = selectedDay || {
    date: today,
    day: today.getDate(),
    dayName: weekdays[today.getDay()],
  };

  const getWeekKey = (date) =>
    `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2,"0")}`;

  const getWeekBookingStats = (weekKey) => {
    const weekBookings = bookings[weekKey] || [];
    const washerCount = weekBookings.filter(b => b.machineType === "washer").length;
    const dryerCount   = weekBookings.filter(b => b.machineType === "dryer").length;
    return { washerCount, dryerCount };
  };

  /* --------------------- FETCH BOOKINGS --------------------- */
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBookings();
        const arr = Array.isArray(data) ? data : data?.data || [];

        const updatedBookings = {};
        const updatedSelectedSlots = {};

        arr.forEach((b) => {
          const weekKey = getWeekKey(new Date(b.start));
          if (!updatedBookings[weekKey]) updatedBookings[weekKey] = [];

          const machineName = b.machine?.name || b.machine || "unknown";
          const hour = new Date(b.start).getHours();
          const slotId = `${machineName}_${hour}`;

          updatedBookings[weekKey].push({ ...b, slotId });
          updatedSelectedSlots[slotId] = true;
        });

        setBookings(updatedBookings);
        setSelectedSlots(updatedSelectedSlots);
      } catch (e) {
        setError("Failed to fetch bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn, userRole]);

  /* --------------------- LOGIN / LOGOUT --------------------- */
  const handleLoginSuccess = (token, userId, role) => {
    if (token) localStorage.setItem("token", token);
    if (userId) localStorage.setItem("userId", userId);
    if (role)   localStorage.setItem("role", role);
    navigate(role === "admin" ? "/admin" : "/", { replace: true });
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole("user");
    setBookings({});
    setSelectedSlots({});
    setSelectedDay(null);
    navigate("/login", { replace: true });
  };

  /* --------------------- CALENDAR --------------------- */
  const handleMonthChange = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDay({ date, day, dayName: weekdays[date.getDay()] });
    navigate("/laundry");
  };

  /* --------------------- BOOKING --------------------- */
  const toggleBooking = async (slotId, machineName, machineType) => {
    const weekKey = getWeekKey(effectiveSelectedDay.date);
    const weekBookings = bookings[weekKey] || [];
    const { washerCount, dryerCount } = getWeekBookingStats(weekKey);
    const isBooked = weekBookings.some(b => b.slotId === slotId);

    if (isBooked) {
      const booking = weekBookings.find(b => b.slotId === slotId);
      if (!booking) return;
      try {
        await cancelBooking(booking._id);
        setBookings(p => ({
          ...p,
          [weekKey]: p[weekKey]?.filter(b => b.slotId !== slotId) || []
        }));
        setSelectedSlots(p => { const u = { ...p }; delete u[slotId]; return u; });
        setError(null);
      } catch { setError("Cancel failed."); }
      return;
    }

    if (machineType === "washer" && washerCount >= MAX_WEEKLY_BOOKINGS.washer) {
      setError("Max 2 washers/week.");
      return;
    }
    if (machineType === "dryer" && dryerCount >= MAX_WEEKLY_BOOKINGS.dryer) {
      setError("Max 2 dryers/week.");
      return;
    }

    const startHour = Number(slotId.split("_").pop());
    const start = new Date(effectiveSelectedDay.date);
    start.setHours(startHour,0,0,0);

    const machine = machines.find(m => m.name === machineName);
    if (!machine) { setError("Machine not found"); return; }

    try {
      const saved = await createBooking({ machineId: machine._id, start });
      const newSlotId = `${machineName}_${startHour}`;
      setBookings(p => ({
        ...p,
        [weekKey]: [...(p[weekKey] || []), { ...saved, slotId: newSlotId }]
      }));
      setSelectedSlots(p => ({ ...p, [newSlotId]: true }));
      setError(null);
    } catch { setError("Booking failed."); }
  };

  const handleUnbook = async (bookingId) => {
    if (!bookingId) return;
    try {
      await cancelBooking(bookingId);
      setBookings(p => {
        const u = { ...p };
        Object.keys(u).forEach(wk => {
          u[wk] = u[wk]?.filter(b => b._id !== bookingId) || [];
        });
        return u;
      });
      setError(null);
    } catch { setError("Unbook failed."); }
  };

  const selectedWeekKey = getWeekKey(effectiveSelectedDay.date);
  const weekBookings = bookings[selectedWeekKey] || [];
  const timeSlots = useMemo(
    () => Array.from({ length: 14 }, (_, i) => `${i + 8}:00 - ${i + 9}:00`),
    []
  );

  /* --------------------- RENDER --------------------- */
  return (
    <>
      {loading && <div className="text-center p-8">Loading…</div>}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 text-center fixed top-0 left-0 right-0 z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* DEBUG BANNER – you will see it change instantly */}
      {isLoggedIn && (
        <div className={`p-2 text-center text-sm font-bold ${userRole === "admin" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}`}>
          Logged in as <span className="uppercase">{userRole}</span>
          {userRole === "admin" && " | ADMIN PANEL ACTIVE"}
        </div>
      )}

      <Routes>
        {/* ADMIN */}
        <Route
          path="/admin"
          element={isLoggedIn && userRole === "admin" ? <AdminDashboard /> : <Navigate to="/login" replace />}
        />

        {/* HOME */}
        <Route
          path="/"
          element={isLoggedIn ? (
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
          )}
        />

        {/* LAUNDRY */}
        <Route
          path="/laundry"
          element={isLoggedIn ? (
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
          )}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={isLoggedIn ? (
            userRole === "admin" ? <Navigate to="/admin" replace /> : <Navigate to="/" replace />
          ) : (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          )}
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="text-center p-8">
              <h1 className="text-2xl mb-4">404 – Not Found</h1>
              <button
                onClick={() => navigate(isLoggedIn ? "/" : "/login")}
                className="text-blue-600 underline"
              >
                Go to {isLoggedIn ? "Home" : "Login"}
              </button>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default App;