import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  approveUserById,
  deleteUserById,
  adminGetAllBookings,
  adminCancelAnyBooking,
  getMachines,
  toggleUserRole,
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
  const currentUserId = localStorage.getItem("userId");

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
        const enrichedBookings = bookingsList
          .filter((b) => b.status === "booked")
          .map((b) => {
            const machine = machinesList.find((m) => m._id === b.machine?._id || m._id === b.machineId);
            const user = usersList.find((u) => u._id === b.user?._id || u._id === b.userId);
            const start = DateTime.fromISO(b.start).setZone("Europe/Helsinki");
            const end = DateTime.fromISO(b.end).setZone("Europe/Helsinki");
            return {
              ...b,
              machineName: machine?.name || "Unknown",
              machineType: machine?.type || "unknown",
              userName: user?.name || "Unknown",
              userEmail: user?.email || "unknown@example.com",
              formattedDate: start.isValid ? start.toFormat("MMM dd, yyyy") : "N/A",
              formattedTime: start.isValid && end.isValid ? `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}` : "N/A",
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

  const handleToggleRole = async (userId, currentRole) => {
    if (!window.confirm(`Change role to ${currentRole === "admin" ? "user" : "admin"}?`)) return;
    try {
      await toggleUserRole(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: currentRole === "admin" ? "user" : "admin" } : u
        )
      );
      alert(`User role changed to ${currentRole === "admin" ? "user" : "admin"}!`);
    } catch {
      alert("Failed to change user role.");
    }
  };

  const handleDirectDelete = async (userId) => {
    if (!window.confirm("Permanently delete this user? This action cannot be undone.")) return;
    try {
      await deleteUserById(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("User deleted successfully.");
    } catch {
      alert("Failed to delete user.");
    }
  };

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

  if (loading) return <div className="p-8 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

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
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="action-buttons">
            <button
              onClick={() => window.location.reload()}
              className="refresh-button"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login", { replace: true });
              }}
              className="logout-button"
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
            className="search-input"
          />
          <div className="tab-buttons">
            {["users", "bookings", "deletion"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? "active" : ""}`}
              >
                {tab === "deletion" ? "Deletion Requests" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {activeTab === "users" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="text-center">Role</th>
                  <th className="text-center">Approval</th>
                  <th className="text-center">Change Role</th>
                  <th className="text-center">Delete</th>
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
                        <span className="status-badge bg-green-100 text-green-800">Approved</span>
                      ) : (
                        <button
                          onClick={() => handleApprove(u._id)}
                          className="approve-button"
                          style={{
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => (e.target.style.backgroundColor = '#27ae60')}
                          onMouseOut={(e) => (e.target.style.backgroundColor = '#2ecc71')}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u._id !== currentUserId ? (
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          className="change-role-button"
                          style={{
                            backgroundColor: '#3498db',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => (e.target.style.backgroundColor = '#2980b9')}
                          onMouseOut={(e) => (e.target.style.backgroundColor = '#3498db')}
                        >
                          {u.role === "admin" ? "Make User" : "Make Admin"}
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u._id !== currentUserId ? (
                        <button
                          onClick={() => handleDirectDelete(u._id)}
                          className="delete-button"
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => (e.target.style.backgroundColor = '#c0392b')}
                          onMouseOut={(e) => (e.target.style.backgroundColor = '#e74c3c')}
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === "bookings" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Machine</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th className="text-center">Actions</th>
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
                        className="unbook-button"
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => (e.target.style.backgroundColor = '#c0392b')}
                        onMouseOut={(e) => (e.target.style.backgroundColor = '#e74c3c')}
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
        {activeTab === "deletion" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Requested At</th>
                  <th className="text-center">Actions</th>
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
                          ? DateTime.fromISO(u.deletionRequestedAt).setZone("Europe/Helsinki").toFormat("MMM dd, HH:mm")
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleApproveDeletion(u._id)}
                          className="delete-request-button"
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => (e.target.style.backgroundColor = '#c0392b')}
                          onMouseOut={(e) => (e.target.style.backgroundColor = '#e74c3c')}
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