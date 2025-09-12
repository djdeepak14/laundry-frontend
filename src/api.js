// src/api.js
import axios from 'axios';

// ---------------------
// Axios instance
// ---------------------
const API = axios.create({
  baseURL: 'https://sevas-laundry.onrender.com', // <- deployed backend URL
  headers: {
    'Content-Type': 'application/json',
  },
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
    console.log('Login response:', response.data);
    return response.data;
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    throw err;
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await API.post('/register', {
      username: username.trim(),
      password: password.trim(),
    });
    console.log('Register response:', response.data);
    return response.data;
  } catch (err) {
    console.error('Register error:', err.response?.data || err.message);
    throw err;
  }
};

// ---------------------
// Booking APIs
// ---------------------
export const getBookings = async (token) => {
  try {
    const response = await API.get('/bookings', setAuthHeader(token));
    console.log('Get bookings response:', response.data);
    return response.data;
  } catch (err) {
    console.error('Get bookings error:', err.response?.data || err.message);
    throw err;
  }
};

export const createBooking = async (booking, token) => {
  try {
    const response = await API.post('/bookings', booking, setAuthHeader(token));
    console.log('Create booking response:', response.data);
    return response.data;
  } catch (err) {
    console.error('Create booking error:', err.response?.data || err.message);
    throw err;
  }
};

export const deleteBooking = async (id, token) => {
  try {
    const response = await API.delete(`/bookings/${id}`, setAuthHeader(token));
    console.log('Delete booking response:', response.data);
    return response.data;
  } catch (err) {
    console.error('Delete booking error:', err.response?.data || err.message);
    throw err;
  }
};
