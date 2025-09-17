import axios from 'axios';

// ---------------------
// Axios instance
// ---------------------
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Must be set in .env
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true, // Needed if backend uses cookies/auth
});

// ---------------------
// JWT Auth helper
// ---------------------
const setAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ---------------------
// Status API
// ---------------------
export const checkStatus = async () => {
  try {
    const { data } = await API.get('/status');
    return data;
  } catch (err) {
    console.error('Status check error:', err.response?.status, err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Failed to check status');
  }
};

// ---------------------
// Auth APIs
// ---------------------
export const loginUser = async (username, password) => {
  try {
    const { data } = await API.post('/login', { username: username.trim(), password: password.trim() });
    return data;
  } catch (err) {
    console.error('Login error:', err.response?.status, err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (username, password) => {
  try {
    const { data } = await API.post('/register', { username: username.trim(), password: password.trim() });
    return data;
  } catch (err) {
    console.error('Register error:', err.response?.status, err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Registration failed');
  }
};

// ---------------------
// Booking APIs
// ---------------------
export const getBookings = async (token) => {
  try {
    const { data } = await API.get('/bookings', setAuthHeader(token));
    return data;
  } catch (err) {
    console.error('Get bookings error:', err.response?.status, err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Failed to fetch bookings');
  }
};

export const createBooking = async (booking, token) => {
  try {
    const { data } = await API.post('/bookings', booking, setAuthHeader(token));
    return data;
  } catch (err) {
    console.error('Create booking error:', err.response?.status, err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Failed to create booking');
  }
};

export const deleteBooking = async (id, token) => {
  try {
    const { data } = await API.delete(`/bookings/${id}`, setAuthHeader(token));
    return data;
  } catch (err) {
    console.error('Delete booking error:', err.response?.status, err.response?.data?.message || err.message);
    throw new Error(err.response?.data?.message || 'Failed to delete booking');
  }
};

// ---------------------
// WebSocket helper
// ---------------------
export const getWebSocket = () => {
  if (!process.env.REACT_APP_WS_URL) {
    console.warn('REACT_APP_WS_URL is not defined in .env');
    return null;
  }
  return new WebSocket(process.env.REACT_APP_WS_URL);
};
