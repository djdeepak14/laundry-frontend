import axios from 'axios';

// ---------------------
// Axios instance
// ---------------------
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001', // uses .env in prod, fallback for local
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// ---------------------
// Auth header helper
// ---------------------
const setAuthHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// ---------------------
// Auth APIs
// ---------------------
export const loginUser = async (username, password) => {
  try {
    const response = await API.post('/login', {
      username: username.trim(),
      password: password.trim(),
    });
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message || 'Login failed';
    console.error('Login error:', message);
    throw new Error(message);
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await API.post('/register', {
      username: username.trim(),
      password: password.trim(),
    });
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message || 'Registration failed';
    console.error('Register error:', message);
    throw new Error(message);
  }
};

// ---------------------
// Booking APIs
// ---------------------
export const getBookings = async (token) => {
  try {
    const response = await API.get('/bookings', setAuthHeader(token));
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to fetch bookings';
    console.error('Get bookings error:', message);
    throw new Error(message);
  }
};

export const createBooking = async (booking, token) => {
  try {
    const response = await API.post('/bookings', booking, setAuthHeader(token));
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to create booking';
    console.error('Create booking error:', message);
    throw new Error(message);
  }
};

export const deleteBooking = async (id, token) => {
  try {
    const response = await API.delete(`/bookings/${id}`, setAuthHeader(token));
    return response.data;
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to delete booking';
    console.error('Delete booking error:', message);
    throw new Error(message);
  }
};
