import axios from 'axios';

// ---------------------
// Axios instance
// ---------------------
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Must be set in .env.production
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
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
// Status API
// ---------------------
export const checkStatus = async () => {
  try {
    const response = await API.get('/status');
    return response.data;
  } catch (err) {
    console.error(
      'Status check error:',
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || 'Failed to check status');
  }
};

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
    console.error(
      'Login error:',
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || 'Login failed');
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
    console.error(
      'Register error:',
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || 'Registration failed');
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
    console.error(
      'Get bookings error:',
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || 'Failed to fetch bookings');
  }
};

export const createBooking = async (booking, token) => {
  try {
    const response = await API.post('/bookings', booking, setAuthHeader(token));
    return response.data;
  } catch (err) {
    console.error(
      'Create booking error:',
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || 'Failed to create booking');
  }
};

export const deleteBooking = async (id, token) => {
  try {
    const response = await API.delete(`/bookings/${id}`, setAuthHeader(token));
    return response.data;
  } catch (err) {
    console.error(
      'Delete booking error:',
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || 'Failed to delete booking');
  }
};

// ---------------------
// WebSocket helper
// ---------------------
export const getWebSocket = () => {
  return new WebSocket(process.env.REACT_APP_WS_URL);
};
