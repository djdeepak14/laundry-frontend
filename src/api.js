// src/api.js
import axios from "axios";

// =============================
// 🔧 API Configuration
// =============================
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
  withCredentials: true,
});

// =============================
// 🛡️ Auth Interceptors
// =============================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    console.log(
      "Request:",
      config.method?.toUpperCase(),
      config.baseURL + config.url,
      config.data ? JSON.stringify(config.data) : ""
    );
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message?.toLowerCase() || "";

    if (error.response?.status === 401 && message.includes("invalid token")) {
      console.warn("Invalid or expired token. Logging out...");
      localStorage.clear();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// =============================
// ⚙️ Error Handler
// =============================
const handleError = (err, defaultMessage) => {
  const message =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    defaultMessage ||
    "An unknown error occurred";

  console.error(`${defaultMessage}:`, message);
  throw new Error(message);
};

// =============================
// 👤 User Authentication
// =============================
export const loginUser = async (email, password) => {
  try {
    const { data } = await API.post("/user/login", { email, password });
    const token = data?.data?.accessToken || data?.token || null;
    const role = data?.data?.user?.role || data?.role || "user";
    const userId = data?.data?.user?._id || data?.userId || null;

    if (token) localStorage.setItem("token", token);
    if (role) localStorage.setItem("role", role);
    if (userId) localStorage.setItem("userId", userId);

    return { token, userId, role };
  } catch (err) {
    throw handleError(err, "Login failed");
  }
};

export const registerUser = async (name, username, email, password) => {
  try {
    const { data } = await API.post("/user/register", {
      name,
      username,
      email,
      password,
    });
    return data;
  } catch (err) {
    throw handleError(err, "Registration failed");
  }
};

export const logoutUser = async () => {
  try {
    await API.post("/user/logout");
    localStorage.clear();
    return { success: true };
  } catch (err) {
    localStorage.clear();
    throw handleError(err, "Logout failed (forced)");
  }
};

// =============================
// 🧺 Bookings
// =============================
export const getBookings = async () => {
  try {
    const { data } = await API.get("/booking");
    const bookings = data?.data || data || [];
    console.log("Fetched bookings:", bookings);
    return Array.isArray(bookings) ? bookings : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch bookings");
  }
};

// ➕ Create booking (independent washer/dryer)
export const createBooking = async (booking) => {
  try {
    const { data } = await API.post("/booking", booking);
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to create booking");
  }
};

// ❌ Cancel booking (user)
export const cancelBooking = async (id) => {
  try {
    const { data } = await API.delete(`/booking/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking");
  }
};

// 🗓️ Admin: get all bookings
export const adminGetAllBookings = async () => {
  try {
    const { data } = await API.get("/booking/admin/all");
    const bookings = data?.data || data || [];
    console.log("Admin: Fetched all bookings:", bookings);
    return Array.isArray(bookings) ? bookings : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch all bookings (admin)");
  }
};

// 🛑 Admin: cancel any booking
export const adminCancelAnyBooking = async (id) => {
  try {
    const { data } = await API.delete(`/booking/admin/cancel/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking as admin");
  }
};

// =============================
// 🧾 Machines
// =============================
export const getMachines = async () => {
  try {
    const { data } = await API.get("/machines");
    const machines = data?.data || data || [];
    console.log("Fetched machines:", machines);
    return Array.isArray(machines) ? machines : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch machines");
  }
};

// =============================
// 👥 Users (Admin)
// =============================
export const getAllUsers = async () => {
  try {
    const { data } = await API.get("/admin/users");
    const users = data?.data || data || [];
    console.log("Fetched all users:", users);
    return Array.isArray(users) ? users : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch users");
  }
};

export const approveUserById = async (id) => {
  try {
    const { data } = await API.patch(`/admin/users/${id}/approve`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to approve user");
  }
};

export const deleteUserById = async (id) => {
  try {
    const { data } = await API.delete(`/admin/users/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to delete user");
  }
};

export default API;
