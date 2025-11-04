import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CalendarGrid from "./CalendarGrid";
import CalendarHeader from "./CalendarHeader";
import { getBookings, getMachines, requestAccountDeletion } from "../api";
import { DateTime } from "luxon";
import logo from "../assets/Sevas.png";
import "../App.css";

const HELSINKI_TZ = "Europe/Helsinki";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      console.error("HomePage Error:", this.state.error);
      return (
        <div style={{ textAlign: "center", margin: "20px" }}>
          <h2>Error rendering component. Please check the console or try logging out.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [error, setError] = useState("");
  const [requestingDelete, setRequestingDelete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBookedLaundry = useCallback(async (retries = 3) => {
    try {
      setLoading(true);
      setError("");
      const machineResponse = await getMachines();
      const allMachines = (machineResponse?.data || machineResponse || []).map((m) => ({
        ...m,
        _id: m._id || m.id,
        name: m.name || m.code || "Unnamed Machine",
        type: m.type || "unknown",
      }));
      setMachines(allMachines);

      const bookings = await getBookings();
      const userId = localStorage.getItem("userId");
      const now = DateTime.now().setZone(HELSINKI_TZ);

      const formatted = (bookings || [])
        .filter((b) => b.status === "booked")
        .filter((b) => b.user?._id === userId || b.userId === userId)
        .filter((b) => DateTime.fromISO(b.end, { zone: "utc" }).setZone(HELSINKI_TZ) > now)
        .map((b, index) => {
          const start = DateTime.fromISO(b.start, { zone: "utc" }).setZone(HELSINKI_TZ);
          const end = DateTime.fromISO(b.end, { zone: "utc" }).setZone(HELSINKI_TZ);
          const m = b.machine || {};
          const machineName = m.name || m.code || "Unknown Machine";
          const machineType = m.type || "machine";
          return {
            ...b,
            _id: b._id || `temp-${index}`,
            date: start.toFormat("yyyy-MM-dd"),
            shortMonth: start.toFormat("LLL"),
            dayNum: start.toFormat("dd"),
            time: `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`,
            machineName,
            machineType,
          };
        })
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      setBookedLaundry(formatted);
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchBookedLaundry(retries - 1);
      }
      console.error("Failed to load bookings:", err);
      setError("Failed to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookedLaundry();
  }, [fetchBookedLaundry]);

  const handleDeleteRequest = async () => {
    const confirm = window.confirm(
      "Are you sure you want to request account deletion?\nYour request will be sent to the admin for review under GDPR."
    );
    if (!confirm) return;

    try {
      setRequestingDelete(true);
      const response = await requestAccountDeletion();

      if (response?.status === 200) {
        alert("✅ Your account deletion request has been sent to the admin.");
      } else if (response?.status === 409) {
        alert("⚠️ You have already requested account deletion. Please wait for admin approval.");
      } else {
        alert("✅ Request submitted successfully.");
      }
    } catch (err) {
      console.error("Deletion request failed:", err);
      alert(err.message || "❌ Failed to request account deletion. Please try again later.");
    } finally {
      setRequestingDelete(false);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <ErrorBoundary>
      <div className="container flex flex-col items-center m-4">
        {/* Header */}
        <div className="landing-center mb-6 text-center">
          <img src={logo} alt="Sevas Laundry Logo" className="landing-logo mb-2 w-28" />
          <h1 className="app-title mb-1 text-3xl font-bold text-blue-700">
            Sevas Laundry Booking
          </h1>
          <p className="current-date-time text-gray-700 mt-2">
            <span className="date font-medium text-lg">{currentDate.toLocaleDateString()}</span>
            <br />
            <span className="time font-mono text-xl">{currentDate.toLocaleTimeString()}</span>
          </p>
        </div>

        {/* Bookings */}
        <div className="booked-laundry-box bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mb-10">
          <h2 className="text-lg font-bold mb-3 border-b-2 border-blue-500 pb-1 text-center">
            Your Upcoming Bookings
          </h2>
          {loading && <p className="text-center text-gray-500">Loading your bookings...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loading && !error && bookedLaundry.length === 0 ? (
            <p className="text-gray-500 text-center">No upcoming bookings.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-6 py-2 text-gray-700">Date & Machine</th>
                    <th className="border border-gray-300 px-6 py-2 text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedLaundry.map((b, i) => (
                    <tr key={b._id || i} className="bg-blue-50 hover:bg-blue-100 transition-colors">
                      <td className="border border-gray-300 px-6 py-2">
                        {b.shortMonth} {b.dayNum} — {b.machineName} ({b.machineType})
                      </td>
                      <td className="border border-gray-300 px-6 py-2 font-mono">{b.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calendar */}
        {months.length > 0 && handleMonthChange && (
          <CalendarHeader
            currentMonth={currentMonth}
            currentYear={currentYear}
            months={months}
            onChange={handleMonthChange}
          />
        )}
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

        {/* Separated Buttons Section */}
        <div className="home-action-buttons">
          <button
            onClick={() => {
              if (typeof handleLogout === "function") handleLogout();
              else navigate("/login", { replace: true });
            }}
            className="logout-button"
          >
            Logout
          </button>
          <button
            onClick={handleDeleteRequest}
            disabled={requestingDelete}
            className="delete-request-button"
          >
            {requestingDelete ? "Requesting..." : "Request Account Deletion"}
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HomePage;