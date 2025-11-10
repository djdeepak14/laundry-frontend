import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  approveUserById,
  deleteUserById,
  adminGetAllBookings,
  adminCancelAnyBooking,
  getMachines,
  toggleUserRole,
  addMachine,
  deleteMachineById,
} from "../api";
import { DateTime } from "luxon";
import { useNavigate } from "react-router-dom";

// main admin dashboard component
const AdminDashboard = () => {
  // states to hold data for users, bookings, and machines
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [machines, setMachines] = useState([]);

  // active tab controls what section of the dashboard is visible
  const [activeTab, setActiveTab] = useState("users");

  // for loading status and handling errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // search term for filtering tables
  const [searchTerm, setSearchTerm] = useState("");

  // navigation hook from react-router
  const navigate = useNavigate();

  // current logged-in user id from local storage
  const currentUserId = localStorage.getItem("userId");

  // fetch all data on mount: users, bookings, and machines
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        // fetch all at once for performance
        const [usersRes, bookingsRes, machinesRes] = await Promise.all([
          getAllUsers(),
          adminGetAllBookings(),
          getMachines(),
        ]);

        // handle possible response shapes
        const usersList = Array.isArray(usersRes)
          ? usersRes
          : usersRes.data || [];
        const machinesList = Array.isArray(machinesRes)
          ? machinesRes
          : machinesRes.data || [];
        const bookingsList = Array.isArray(bookingsRes)
          ? bookingsRes
          : bookingsRes.data || [];

        // enrich bookings with human-readable info
        const enrichedBookings = bookingsList
          .filter((b) => b.status === "booked")
          .map((b) => {
            const machineId =
              typeof b.machine === "object"
                ? b.machine?._id?.toString()
                : b.machine?.toString();
            const userId =
              typeof b.user === "object"
                ? b.user?._id?.toString()
                : b.user?.toString();

            // find the related user and machine
            const machine = machinesList.find(
              (m) => m._id?.toString() === machineId
            );
            const user = usersList.find((u) => u._id?.toString() === userId);

            // handle timezones properly using Luxon
            const start = DateTime.fromISO(b.start).setZone("Europe/Helsinki");
            const end = DateTime.fromISO(b.end).setZone("Europe/Helsinki");

            // prepare clean, readable data
            return {
              ...b,
              machineName: machine?.name || machine?.code || "Unknown Machine",
              machineType: machine?.type || "unknown",
              userName: user?.name || "Unknown",
              userEmail: user?.email || "unknown@example.com",
              formattedDate: start.isValid
                ? start.toFormat("MMM dd, yyyy")
                : "N/A",
              formattedTime:
                start.isValid && end.isValid
                  ? `${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`
                  : "N/A",
            };
          })
          // newest bookings first
          .sort((a, b) => new Date(b.start) - new Date(a.start));

        // set all data
        setUsers(usersList);
        setBookings(enrichedBookings);
        setMachines(machinesList);
      } catch (err) {
        console.error("Admin data load error:", err);
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // user management section
  const handleApprove = async (userId) => {
    if (!window.confirm("Approve this user?")) return;
    try {
      await approveUserById(userId);
      const now = new Date().toISOString();
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isApproved: true, approvedAt: now } : u
        )
      );
      alert("User approved!");
    } catch {
      alert("Failed to approve user.");
    }
  };

  // handle GDPR-based deletion approval
  const handleApproveDeletion = async (userId) => {
    if (
      !window.confirm(
        "Approve this deletion request and permanently delete this user?"
      )
    )
      return;
    try {
      await deleteUserById(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("User deleted under GDPR request.");
    } catch {
      alert("Failed to delete user.");
    }
  };

  // toggle between user and admin roles
  const handleToggleRole = async (userId, currentRole) => {
    if (
      !window.confirm(
        `Change role to ${currentRole === "admin" ? "user" : "admin"}?`
      )
    )
      return;
    try {
      await toggleUserRole(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, role: currentRole === "admin" ? "user" : "admin" }
            : u
        )
      );
      alert(
        `User role changed to ${
          currentRole === "admin" ? "user" : "admin"
        } successfully!`
      );
    } catch {
      alert("Failed to change user role.");
    }
  };

  // permanent user deletion by admin
  const handleDirectDelete = async (userId) => {
    if (!window.confirm("Permanently delete this user?")) return;
    try {
      await deleteUserById(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("User deleted successfully.");
    } catch {
      alert("Failed to delete user.");
    }
  };

  // cancel any booking by admin
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

  // machine management section
  const handleAddMachine = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const code = form.code.value.trim();
    const type = form.type.value;
    if (!name || !code) return alert("Please fill all fields");
    try {
      const newMachine = await addMachine({ name, code, type });
      setMachines((prev) => [...prev, newMachine]);
      form.reset();
      alert("Machine added successfully!");
    } catch {
      alert("Failed to add machine.");
    }
  };

  // delete machine by id
  const handleDeleteMachine = async (id) => {
    if (!window.confirm("Delete this machine?")) return;
    try {
      await deleteMachineById(id);
      setMachines((prev) => prev.filter((m) => m._id !== id));
      alert("Machine deleted successfully!");
    } catch {
      alert("Failed to delete machine.");
    }
  };

  // simple loading and error handling
  if (loading)
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // filtering logic for search
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

  // main dashboard UI layout
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* top section: title and logout/refresh buttons */}
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="action-buttons">
            <button onClick={() => window.location.reload()} className="refresh-button">
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

        {/* search bar and tab navigation */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder={`Search ${activeTab}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="tab-buttons">
            {["users", "bookings", "machines", "deletion"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? "active" : ""}`}
              >
                {tab === "deletion"
                  ? "Deletion Requests"
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* users management table */}
        {activeTab === "users" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="text-center">Role</th>
                  <th className="text-center">Approval</th>
                  <th className="text-center">Approved At</th>
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
                        <span className="status-badge bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(u._id)}
                          style={{
                            backgroundColor: "#2ecc71",
                            color: "white",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 text-sm">
                      {u.approvedAt
                        ? DateTime.fromISO(u.approvedAt)
                            .setZone("Europe/Helsinki")
                            .toFormat("MMM dd, HH:mm")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u._id !== currentUserId ? (
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          style={{
                            backgroundColor: "#3498db",
                            color: "white",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
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
                          style={{
                            backgroundColor: "#e74c3c",
                            color: "white",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
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

        {/* bookings section */}
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
                    <td className="px-6 py-4">
                      {b.machineName}
                      <div className="text-xs text-gray-500">
                        ({b.machineType})
                      </div>
                    </td>
                    <td className="px-6 py-4">{b.formattedDate}</td>
                    <td className="px-6 py-4 font-mono">{b.formattedTime}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        style={{
                          backgroundColor: "#e74c3c",
                          color: "white",
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
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

        {/* machines management section */}
        {activeTab === "machines" && (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mt-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Machines</h2>

            {/* add machine form */}
            <form
              onSubmit={handleAddMachine}
              className="mb-6 flex flex-wrap gap-4 items-end"
            >
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Machine Name</label>
                <input
                  type="text"
                  name="name"
                  className="border rounded-lg px-3 py-2"
                  placeholder="e.g. Washer 1"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Machine Code</label>
                <input
                  type="text"
                  name="code"
                  className="border rounded-lg px-3 py-2"
                  placeholder="e.g. W001"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Type</label>
                <select
                  name="type"
                  className="border rounded-lg px-3 py-2"
                  required
                >
                  <option value="washer">Washer</option>
                  <option value="dryer">Dryer</option>
                </select>
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#2ecc71",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Add Machine
              </button>
            </form>

            {/* machines list */}
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {machines && machines.length ? (
                  machines.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{m.name}</td>
                      <td className="px-6 py-4 font-mono text-sm">{m.code}</td>
                      <td className="px-6 py-4">{m.type}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteMachine(m._id)}
                          style={{
                            backgroundColor: "#e74c3c",
                            color: "white",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-8 text-gray-500"
                    >
                      No machines found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* deletion requests section */}
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
                          ? DateTime.fromISO(u.deletionRequestedAt)
                              .setZone("Europe/Helsinki")
                              .toFormat("MMM dd, HH:mm")
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleApproveDeletion(u._id)}
                          style={{
                            backgroundColor: "#e74c3c",
                            color: "white",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Approve Deletion
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-8 text-gray-500"
                    >
                      No pending deletion requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* simple footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        Laundry Admin © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default AdminDashboard;
