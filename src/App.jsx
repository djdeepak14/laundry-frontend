import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";
import { DateTime } from "luxon";
import HomePage from "./components/HomePage";
import LaundryBookingPage from "./components/LaundryBookingPage";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./components/AdminDashboard";
import { getBookings, createBooking, cancelBooking, getMachines } from "./api";

// Define the timezone for all date/time operations
const HELSINKI_TZ = "Europe/Helsinki";

// Month and weekday names for calendar display
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Maximum number of active bookings allowed per machine type
const MAX_BOOKINGS = { washer: 2, dryer: 2 };

const App = () => {
  // Initialize today's date
  const today = new Date();

  // Calendar and booking state variables
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get stored user info from localStorage
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "user";
  const loggedIn = !!token;
  const [isLoggedIn, setIsLoggedIn] = useState(loggedIn);
  const [userRole, setUserRole] = useState(role);

  // Keep login state in sync with changes in localStorage
  useEffect(() => {
    const handler = () => {
      const newToken = localStorage.getItem("token");
      const newRole = localStorage.getItem("role") || "user";
      setIsLoggedIn(!!newToken);
      setUserRole(newRole);
    };
    window.addEventListener("storage", handler);
    const poll = setInterval(handler, 500);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(poll);
    };
  }, []);

  // Default selected day (today) if none is chosen
  const effectiveSelectedDay = selectedDay || {
    date: today,
    day: today.getDate(),
    dayName: weekdays[today.getDay()],
  };

  // Calculate the user's active booking statistics (per machine type)
  const getBookingStats = () => {
    const userId = localStorage.getItem("userId");
    const activeBookings = bookings.filter(
      b => (b.user?._id === userId || b.userId === userId) &&
           b.status === "booked" &&
           new Date(b.end).getTime() > Date.now()
    );

    const washerCount = activeBookings.filter(b => b.machine?.type === "washer").length;
    const dryerCount = activeBookings.filter(b => b.machine?.type === "dryer").length;

    const latestWasherEnd = Math.max(...activeBookings.filter(b => b.machine?.type === "washer").map(b => new Date(b.end).getTime()), 0);
    const latestDryerEnd = Math.max(...activeBookings.filter(b => b.machine?.type === "dryer").map(b => new Date(b.end).getTime()), 0);

    return { washerCount, dryerCount, latestWasherEnd, latestDryerEnd };
  };

  // Fetch all bookings and machines for the logged-in user
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bookingData, machineData] = await Promise.all([getBookings(), getMachines()]);
        const bookingsArr = Array.isArray(bookingData) ? bookingData : bookingData?.data || [];
        const machinesArr = Array.isArray(machineData) ? machineData : machineData?.data || [];

        // Normalize booking data for time zone and machine info
        const updatedBookings = bookingsArr.map(b => ({
          ...b,
          slotId: `${b.machine?.name || b.machine || "unknown"}_${DateTime.fromISO(b.start, { zone: "utc" }).setZone(HELSINKI_TZ).hour}`,
          machine: { ...b.machine, type: b.machine?.type || "unknown" }
        }));

        setBookings(updatedBookings);
        setMachines(machinesArr);

        // Update selected slot states
        const updatedSelectedSlots = {};
        updatedBookings.forEach(b => {
          updatedSelectedSlots[b.slotId] = b.status === "booked";
        });
        setSelectedSlots(updatedSelectedSlots);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isLoggedIn, userRole]);

  // Handle successful login
  const handleLoginSuccess = (token, userId, role) => {
    if (token) localStorage.setItem("token", token);
    if (userId) localStorage.setItem("userId", userId);
    if (role) localStorage.setItem("role", role);
    setIsLoggedIn(true);
    setUserRole(role);
    navigate(role === "admin" ? "/admin" : "/", { replace: true });
  };

  // Handle logout process
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole("user");
    setBookings([]);
    setSelectedSlots({});
    setMachines([]);
    setSelectedDay(null);
    navigate("/login", { replace: true });
  };

  // Navigate between months in the calendar
  const handleMonthChange = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDay(null);
  };

  // Handle when a user clicks a specific day in the calendar
  const handleDayClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDay({ date, day, dayName: weekdays[date.getDay()] });
    navigate("/laundry");
  };

  // Manage booking and unbooking logic
  const toggleBooking = async (slotId, machineName, machineType) => {
    const { washerCount, dryerCount, latestWasherEnd, latestDryerEnd } = getBookingStats();
    const isBooked = selectedSlots[slotId];
    const now = Date.now();

    // Unbook if already booked
    if (isBooked) {
      const booking = bookings.find(b => b.slotId === slotId && b.status === "booked");
      if (!booking) return;
      try {
        await cancelBooking(booking._id);
        setBookings(prev => prev.filter(b => b._id !== booking._id));
        setSelectedSlots(prev => {
          const u = { ...prev };
          delete u[slotId];
          return u;
        });
        setError(null);
      } catch {
        setError("Failed to cancel booking.");
      }
      return;
    }

    // Enforce waiting time between bookings for washers and dryers
    if (machineType === "washer" && latestWasherEnd > now) {
      const nextTime = DateTime.fromJSDate(new Date(latestWasherEnd), { zone: "utc" })
        .setZone(HELSINKI_TZ)
        .toFormat("yyyy-MM-dd HH:mm");
      setError(`You must wait until your last washer booking ends on ${nextTime} EET before booking another.`);
      return;
    }
    if (machineType === "dryer" && latestDryerEnd > now) {
      const nextTime = DateTime.fromJSDate(new Date(latestDryerEnd), { zone: "utc" })
        .setZone(HELSINKI_TZ)
        .toFormat("yyyy-MM-dd HH:mm");
      setError(`You must wait until your last dryer booking ends on ${nextTime} EET before booking another.`);
      return;
    }

    // Enforce booking limits per machine type
    if (machineType === "washer" && washerCount >= MAX_BOOKINGS.washer) {
      setError("You have reached the maximum of 2 active washer bookings.");
      return;
    }
    if (machineType === "dryer" && dryerCount >= MAX_BOOKINGS.dryer) {
      setError("You have reached the maximum of 2 active dryer bookings.");
      return;
    }

    // Create booking data for API call
    const startHour = Number(slotId.split("_")[1]);
    const base = effectiveSelectedDay.date;
    const startLocal = DateTime.fromObject(
      {
        year: base.getFullYear(),
        month: base.getMonth() + 1,
        day: base.getDate(),
        hour: startHour,
        minute: 0,
      },
      { zone: HELSINKI_TZ }
    );

    const startISO = startLocal.toUTC().toISO({ suppressMilliseconds: true });

    const machine = machines.find(m => m.name === machineName && m.type === machineType);
    if (!machine) {
      setError("Machine not found");
      return;
    }

    // Save booking through API
    try {
      const saved = await createBooking({ machineId: machine._id, start: startISO });
      const newSlotId = `${machineName}_${startLocal.hour}`;
      setBookings(prev => [
        ...prev,
        { ...saved, slotId: newSlotId, machine: { ...saved.machine, type: machineType } }
      ]);
      setSelectedSlots(prev => ({ ...prev, [newSlotId]: true }));
      setError(null);
    } catch (e) {
      setError(e.message || "Failed to create booking.");
    }
  };

  // Handle cancellation of an existing booking
  const handleUnbook = async (bookingId) => {
    if (!bookingId) return;
    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.filter(b => b._id !== bookingId));
      setSelectedSlots(prev => {
        const u = { ...prev };
        Object.keys(u).forEach(slotId => {
          if (!bookings.find(b => b.slotId === slotId && b.status === "booked")) {
            delete u[slotId];
          }
        });
        return u;
      });
      setError(null);
    } catch {
      setError("Failed to cancel booking.");
    }
  };

  // Define available time slots for booking (8:00–22:00)
  const timeSlots = useMemo(
    () => Array.from({ length: 14 }, (_, i) => `${i + 8}:00 - ${i + 9}:00`),
    []
  );

  // Main rendering logic
  return (
    <>
      {loading && <div className="text-center p-8">Loading…</div>}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 text-center fixed top-0 left-0 right-0 z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-bold">
            ×
          </button>
        </div>
      )}

      {isLoggedIn && (
        <div
          className={`p-2 text-center text-sm font-bold ${
            userRole === "admin" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
          }`}
        >
          Logged in as <span className="uppercase">{userRole}</span>
          {userRole === "admin" && " | ADMIN PANEL ACTIVE"}
        </div>
      )}

      <Routes>
        {/* Admin route: only accessible by admins */}
        <Route
          path="/admin"
          element={
            isLoggedIn && userRole === "admin"
              ? <AdminDashboard />
              : <Navigate to="/login" replace />
          }
        />

        {/* Home page route for users */}
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
                selectedDay={effectiveSelectedDay}
                setSelectedDay={setSelectedDay}
                bookings={bookings}
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

        {/* Laundry booking page for active users */}
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
                weekBookings={bookings}
                handleUnbook={handleUnbook}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Login route for authentication */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              userRole === "admin"
                ? <Navigate to="/admin" replace />
                : <Navigate to="/" replace />
            ) : (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Fallback route for undefined pages */}
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
