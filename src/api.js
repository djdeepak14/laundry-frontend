// src/api.js
import axios from "axios";

// --- Base Axios instance ---
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
  withCredentials: true,
});

// --- Request interceptor (attach JWT) ---
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(
      "➡️ Request:",
      config.method?.toUpperCase(),
      (config.baseURL || "") + (config.url || ""),
      config.data || ""
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor (handle expired/invalid tokens) ---
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      String(error.response?.data?.message || "").toLowerCase().includes("invalid")
    ) {
      console.warn("⚠️ Invalid or expired token. Clearing localStorage...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// --- Centralized error handler ---
const handleError = (err, defaultMessage) => {
  let message;
  if (err.code === "ERR_NETWORK") {
    message =
      "Network error: Unable to connect to the server. Ensure the backend is running at http://localhost:5000.";
  } else if (err.response?.status === 404) {
    message = `${defaultMessage}: Endpoint not found at ${err.response.config.url}. Check backend routes.`;
  } else if (err.response?.status === 500 && err.response?.data?.message?.includes("Machine not found")) {
    message = "Machine not found. Please verify the machine ID and ensure it exists in the system.";
  } else if (err.response?.data?.message?.includes("Cast to ObjectId failed")) {
    message = "Invalid ID format. Please provide a valid MongoDB ObjectId.";
  } else {
    message = err.response?.data?.message || err.message || defaultMessage;
  }
  console.error(`${defaultMessage}:`, message);
  throw new Error(message);
};

//
// ==========================
// 🔹 STATUS CHECK
// ==========================
export const checkStatus = async () => {
  try {
    const { data } = await API.get("/status");
    console.log("Status response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Status check failed");
  }
};

//
// ==========================
// 🔹 AUTH APIs
// ==========================
export const loginUser = async (email, password) => {
  try {
    const { data } = await API.post("/auth/login", { email, password });
    if (data?.accessToken) {
      localStorage.setItem("token", data.accessToken);
    }
    console.log("Login response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Login failed");
  }
};

export const registerUser = async (name, username, email, password) => {
  try {
    const { data } = await API.post("/auth/register", {
      name,
      username,
      email,
      password,
    });
    console.log("Register response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Registration failed");
  }
};

export const logoutUser = async () => {
  try {
    const { data } = await API.post("/auth/logout");
    localStorage.removeItem("token");
    console.log("Logout response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Logout failed");
  }
};

//
// ==========================
// 🔹 USER APIs (optional)
// ==========================
export const getCurrentUser = async () => {
  try {
    const { data } = await API.get("/user/info");
    console.log("User info response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to fetch user info");
  }
};

//
// ==========================
// 🔹 BOOKING APIs
// ==========================
export const getBookings = async () => {
  try {
    const { data } = await API.get("/booking");
    console.log("Fetched bookings:", data);
    // Backend uses ApiResponse { statusCode, data, message, success }
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  } catch (err) {
    throw handleError(err, "Failed to fetch bookings");
  }
};

export const createBooking = async (booking) => {
  try {
    if (!booking.machineId || !/^[0-9a-fA-F]{24}$/.test(booking.machineId)) {
      throw new Error("Invalid machineId: Must be a valid MongoDB ObjectId.");
    }
    // Backend expects UTC ISO at exact hour
    console.log("Creating booking with payload:", booking);
    const { data } = await API.post("/booking", booking);
    console.log("Create booking response:", data);
    // Return created booking (ApiResponse.data or bare)
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to create booking");
  }
};

export const cancelBooking = async (id) => {
  try {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new Error("Invalid booking ID: Must be a valid MongoDB ObjectId.");
    }
    const { data } = await API.delete(`/booking/${id}`);
    console.log("Cancel booking response:", data);
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking");
  }
};

//
// ==========================
// 🔹 MACHINE APIs
// ==========================
export const getMachines = async () => {
  try {
    const { data } = await API.get("/machines");
    console.log("Fetched machines:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to fetch machines");
  }
};

export const createMachine = async (machine) => {
  try {
    const { data } = await API.post("/machines", machine);
    console.log("Create machine response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to create machine");
  }
};

export const deleteMachineById = async (id) => {
  try {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new Error("Invalid machine ID: Must be a valid MongoDB ObjectId.");
    }
    const { data } = await API.delete(`/machines/${id}`);
    console.log("Delete machine response:", data);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to delete machine");
  }
};

//
// ==========================
// 🔹 WEBSOCKET CONNECTION
// ==========================
export const getWebSocket = () => {
  const wsUrl = process.env.REACT_APP_WS_URL || "ws://localhost:5000";
  console.log("WebSocket URL:", wsUrl);
  return new WebSocket(wsUrl);
};

export default API;
