import axios from "axios";

// ---------------------
// Axios instance
// ---------------------
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // Must be set in .env
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
  withCredentials: true, // Needed if backend uses cookies/auth
});

// ---------------------
// Automatically attach JWT if in localStorage
// ---------------------
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------
// Status API
// ---------------------
export const checkStatus = async () => {
  try {
    const { data } = await API.get("/status");
    return data;
  } catch (err) {
    console.error(
      "Status check error:",
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || "Failed to check status");
  }
};

// ---------------------
// Auth APIs
// ---------------------
export const loginUser = async (username, password) => {
  try {
    const { data } = await API.post("/login", {
      username: username.trim(),
      password: password.trim(),
    });
    // Save token automatically
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  } catch (err) {
    console.error(
      "Login error:",
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || "Login failed");
  }
};

export const registerUser = async (username, password) => {
  try {
    const { data } = await API.post("/register", {
      username: username.trim(),
      password: password.trim(),
    });
    return data;
  } catch (err) {
    console.error(
      "Register error:",
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || "Registration failed");
  }
};

// ---------------------
// Booking APIs
// ---------------------
export const getBookings = async () => {
  try {
    const { data } = await API.get("/bookings");
    return data;
  } catch (err) {
    console.error(
      "Get bookings error:",
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || "Failed to fetch bookings");
  }
};

export const createBooking = async (booking) => {
  try {
    console.log("Creating booking:", booking);
    const { data } = await API.post("/bookings", booking);
    return data;
  } catch (err) {
    console.error(
      "Create booking error:",
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || "Failed to create booking");
  }
};

export const deleteBooking = async (id) => {
  try {
    console.log("Deleting booking id:", id);
    const { data } = await API.delete(`/bookings/${id}`);
    return data;
  } catch (err) {
    console.error(
      "Delete booking error:",
      err.response?.status,
      err.response?.data?.message || err.message
    );
    throw new Error(err.response?.data?.message || "Failed to delete booking");
  }
};

// ---------------------
// WebSocket helper
// ---------------------
export const getWebSocket = () => {
  if (!process.env.REACT_APP_WS_URL) {
    console.warn("REACT_APP_WS_URL is not defined in .env");
    return null;
  }
  return new WebSocket(process.env.REACT_APP_WS_URL);
};
