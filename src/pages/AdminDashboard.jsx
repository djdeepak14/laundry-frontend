import React, { useEffect, useState } from 'react';
import { getBookings, deleteBooking } from '../api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Load token from localStorage
  const token = localStorage.getItem('token');

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings(token);
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Delete booking by ID
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteBooking(id, token);
      setBookings(bookings.filter((b) => b._id !== id));
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  // Logout admin
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchBookings();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading bookings...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">User</th>
                <th className="p-3 border">Machine</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Time</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="p-3 border">{booking.username}</td>
                  <td className="p-3 border">{booking.machine}</td>
                  <td className="p-3 border">
                    {new Date(booking.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">{booking.time}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => handleDelete(booking._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
