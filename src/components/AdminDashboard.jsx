import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  approveUserById,
  deleteUserById,
  adminGetAllBookings,
  adminCancelAnyBooking,
  getMachines,
} from "../api";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // users | bookings | deletion
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch everything
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
        const machinesList = Array.isArray(machinesRes) ? machinesRes : machinesRes.data || [];
        const bookingsList = Array.isArray(bookingsRes) ? bookingsRes : bookingsRes.data || [];

        // Enrich booking data
        const enrichedBookings = bookingsList
          .filter((b) => b.status === "booked")
          .map((b) => {
            const machine = machinesList.find((m) => m._id === b.machine?._id || m._id === b.machineId);
            const user = usersList.find((u) => u._id === b.user?._id || u._id === b.userId);
            const start = DateTime.fromISO(b.start);
            const end = DateTime.fromISO(b.end);
            return {
              ...b,
              machineName: machine?.name || "Unknown",
              machineType: machine?.type || "unknown",
              userName: user?.name || "Unknown",
              userEmail: user?.email || "unknown@example.com",
              formattedDate: start.isValid ? start.toFormat("MMM dd, yyyy") : "N/A",
              formattedTime:
                start.isValid && end.isValid ? `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}` : "N/A",
              duration: start.isValid && end.isValid ? end.diff(start, "hours").hours : 0,
            };
          })
          .sort((a, b) => new Date(b.start) - new Date(a.start));

        setUsers(usersList);
        setBookings(enrichedBookings);
      } catch (err) {
        console.error("Admin data load error:", err);
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Approve user
  const handleApprove = async (userId) => {
    if (!window.confirm("Approve this user?")) return;
    try {
      await approveUserById(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isApproved: true } : u))
      );
      alert("User approved!");
    } catch {
      alert("Failed to approve user.");
    }
  };

  // Approve deletion (GDPR)
  const handleApproveDeletion = async (userId) => {
    if (!window.confirm("Approve this deletion request and permanently delete this user?")) return;
    try {
      await deleteUserById(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("User deleted under GDPR request.");
    } catch {
      alert("Failed to delete user.");
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await adminCancelAnyBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      alert("Booking cancelled successfully!");
    } catch {
      alert("Failed to cancel booking.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deletionRequests = users.filter((u) => u.deletionRequested === true);

  const filteredBookings = bookings.filter(
    (b) =>
      b.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.machineName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login", { replace: true });
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder={`Search ${activeTab}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {["users", "bookings", "deletion"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg capitalize ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {tab === "deletion" ? "Deletion Requests" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="min-w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-center">Role</th>
                  <th className="px-6 py-3 text-center">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-sm">{u.email}</td>
                    <td className="px-6 py-4 text-center">{u.role}</td>
                    <td className="px-6 py-4 text-center">
                      {u.isApproved ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Approved</span>
                      ) : (
                        <button
                          onClick={() => handleApprove(u._id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg text-xs"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
            <table className="min-w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Machine</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Time</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{b.userName}</td>
                    <td className="px-6 py-4">{b.machineName}</td>
                    <td className="px-6 py-4">{b.formattedDate}</td>
                    <td className="px-6 py-4 font-mono">{b.formattedTime}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="px-4 py-2 rounded-lg text-sm text-white bg-orange-500 hover:bg-orange-600"
                      >
                        Unbook
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DELETION REQUESTS TAB */}
        {activeTab === "deletion" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
            <table className="min-w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Requested At</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deletionRequests.length ? (
                  deletionRequests.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{u.name}</td>
                      <td className="px-6 py-4 font-mono text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        {u.deletionRequestedAt
                          ? DateTime.fromISO(u.deletionRequestedAt).toFormat("MMM dd, HH:mm")
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleApproveDeletion(u._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Approve Deletion
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      No pending deletion requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
