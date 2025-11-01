// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  approveUserById,
  deleteUserById,
  adminGetAllBookings,      // Admin-only: fetch all
  adminCancelAnyBooking,    // Admin-only: cancel any
  getMachines,
} from "../api";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [bookingsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        const [usersRes, bookingsRes, machinesRes] = await Promise.all([
          getAllUsers(),
          adminGetAllBookings(),
          getMachines(),
        ]);

        const usersList = Array.isArray(usersRes) ? usersRes : usersRes.data || [];
        setUsers(usersList);

        const machinesList = Array.isArray(machinesRes) ? machinesRes : machinesRes.data || [];
        const bookingsList = Array.isArray(bookingsRes) ? bookingsRes : bookingsRes.data || [];

        const enriched = bookingsList
          .map((b) => {
            const machine = machinesList.find(
              (m) => m._id === b.machine?._id || m._id === b.machineId
            );
            const user = usersList.find(
              (u) => u._id === b.user?._id || u._id === b.userId
            );
            const start = DateTime.fromISO(b.start);
            const end = DateTime.fromISO(b.end);
            return {
              ...b,
              machineName: machine?.name || b.machine?.name || "Unknown",
              machineType: machine?.type || b.machine?.type || "unknown",
              userName: user?.name || b.user?.name || "Unknown",
              userEmail: user?.email || b.user?.email || "unknown@example.com",
              formattedDate: start.isValid ? start.toFormat("MMM dd, yyyy") : "N/A",
              formattedTime:
                start.isValid && end.isValid
                  ? `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`
                  : "N/A",
              duration: start.isValid && end.isValid ? end.diff(start, "hours").hours : 0,
            };
          })
          .sort((a, b) => new Date(b.start) - new Date(a.start));

        setBookings(enriched);
      } catch (err) {
        console.error("Admin data load error:", err);
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm("Approve this user?")) return;
    try {
      await approveUserById(userId);
      setUsers((p) =>
        p.map((u) => (u._id === userId ? { ...u, isApproved: true } : u))
      );
      alert("User approved!");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Failed to approve user");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await deleteUserById(userId);
      setUsers((p) => p.filter((u) => u._id !== userId));
      alert("User deleted!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete user");
    }
  };

  const handleCancelBooking = async (bookingId, status) => {
    const action = status === "booked" ? "unbook" : "cancel";
    const actionPast = status === "booked" ? "unbooked" : "cancelled";
    if (!window.confirm(`Are you sure you want to ${action} this booking?`)) return;

    try {
      await adminCancelAnyBooking(bookingId);
      setBookings((p) => p.filter((b) => b._id !== bookingId));
      alert(`Booking ${actionPast} successfully!`);
    } catch (err) {
      console.error(`${action} error:`, err);
      alert(`Failed to ${action} booking.`);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r) => Object.values(r).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings
    .filter(
      (b) =>
        b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.formattedDate.includes(searchTerm)
    )
    .filter((b) => filterStatus === "all" || b.status === filterStatus);

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * bookingsPerPage,
    bookingPage * bookingsPerPage
  );

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const totalBookingPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder={`Search ${activeTab === "users" ? "users" : "bookings"}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setUserPage(1);
              setBookingPage(1);
            }}
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 rounded-lg ${
                activeTab === "users"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-6 py-3 rounded-lg ${
                activeTab === "bookings"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Bookings
            </button>
          </div>
        </div>

        {activeTab === "bookings" && (
          <div className="mb-4">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setBookingPage(1);
              }}
              className="p-2 border rounded-lg"
            >
              <option value="all">All</option>
              <option value="booked">Booked</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => exportToCSV(filteredUsers, "users.csv")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            disabled={!filteredUsers.length}
          >
            Export Users CSV
          </button>
          <button
            onClick={() => exportToCSV(filteredBookings, "bookings.csv")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            disabled={!filteredBookings.length}
          >
            Export Bookings CSV
          </button>
        </div>

        {/* USERS TABLE */}
        {activeTab === "users" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="min-w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-center">Role</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Joined</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.length ? (
                  paginatedUsers.map((u) => {
                    const created =
                      u.createdAt && DateTime.fromISO(u.createdAt).isValid
                        ? DateTime.fromISO(u.createdAt).toFormat("MMM dd, yyyy")
                        : "N/A";

                    return (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{u.name || "N/A"}</td>
                        <td className="px-6 py-4 font-mono text-sm">{u.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {u.role === "admin" ? (
                            <span className="text-blue-600 font-semibold">
                              Always Approved
                            </span>
                          ) : u.isApproved ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Approved
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {created}
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          {u.role !== "admin" && (
                            <>
                              {!u.isApproved && (
                                <button
                                  onClick={() => handleApprove(u._id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(u._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalUserPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {userPage} of {totalUserPages}
                </span>
                <button
                  onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  disabled={userPage === totalUserPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TABLE */}
        {activeTab === "bookings" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="min-w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Machine</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Hours</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedBookings.length ? (
                  paginatedBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>{b.userName}</div>
                        <div className="text-sm text-gray-500">{b.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{b.machineName}</div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            b.machineType === "washer"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {b.machineType}
                        </span>
                      </td>
                      <td className="px-6 py-4">{b.formattedDate}</td>
                      <td className="px-6 py-4 font-mono">{b.formattedTime}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            b.status === "booked"
                              ? "bg-green-100 text-green-800"
                              : b.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {b.duration ? b.duration.toFixed(1) : "0.0"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(b.status === "booked" || b.status === "completed") && (
                          <button
                            onClick={() => handleCancelBooking(b._id, b.status)}
                            className={`px-4 py-2 rounded-lg text-sm text-white ${
                              b.status === "booked"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            {b.status === "booked" ? "Unbook" : "Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalBookingPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                  disabled={bookingPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {bookingPage} of {totalBookingPages}
                </span>
                <button
                  onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                  disabled={bookingPage === totalBookingPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Laundry Admin © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AdminDashboard;
