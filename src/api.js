import axios from "axios";

// Set up the base API configuration used throughout the app
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
  withCredentials: true,
});

// Intercept every request to attach the token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(
      `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      config.data ? JSON.stringify(config.data) : ""
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses globally and manage authentication issues
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message?.toLowerCase() || "";
    if (error.response?.status === 401 && message.includes("invalid")) {
      console.warn("Invalid or expired token. Logging out...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Centralized function to handle and throw consistent error messages
const handleError = (err, defaultMessage) => {
  const message =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    defaultMessage ||
    "An unknown error occurred.";

  console.error(`${defaultMessage}:`, message);
  throw new Error(message);
};

// Login function to authenticate a user and store credentials locally
export const loginUser = async (email, password) => {
  try {
    const { data } = await API.post("/user/login", { email, password });
    const token = data?.data?.accessToken || data?.token;
    const role = data?.data?.user?.role || data?.role || "user";
    const userId = data?.data?.user?._id || data?.userId;

    if (token) localStorage.setItem("token", token);
    if (role) localStorage.setItem("role", role);
    if (userId) localStorage.setItem("userId", userId);

    return { token, userId, role };
  } catch (err) {
    throw handleError(err, "Login failed");
  }
};

// Register a new user in the system
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

// Logout user and clear all locally stored credentials
export const logoutUser = async () => {
  try {
    await API.post("/user/logout");
    localStorage.clear();
    return { success: true };
  } catch (err) {
    localStorage.clear();
    throw handleError(err, "Logout failed");
  }
};

// Request account deletion in compliance with GDPR
export const requestAccountDeletion = async () => {
  try {
    const response = await API.post("/user/request-deletion");
    console.log("Account deletion request submitted:", response.data);
    return response;
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || "";

    if (status === 400 || status === 409 || msg.includes("already requested")) {
      console.warn("Account deletion has already been requested.");
      return { status: 409, message: "You have already requested account deletion." };
    }

    throw handleError(
      err,
      "Failed to request account deletion. Please try again later."
    );
  }
};

// Fetch all bookings belonging to the currently logged-in user
export const getBookings = async () => {
  try {
    const { data } = await API.get("/booking");
    const bookings = data?.data || data || [];
    console.log("Bookings fetched:", bookings);
    return Array.isArray(bookings) ? bookings : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch bookings");
  }
};

// Create a new booking
export const createBooking = async (booking) => {
  try {
    const { data } = await API.post("/booking", booking);
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to create booking");
  }
};

// Cancel a booking by its ID
export const cancelBooking = async (id) => {
  try {
    const { data } = await API.delete(`/booking/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking");
  }
};

// Fetch all bookings for administrators
export const adminGetAllBookings = async () => {
  try {
    const { data } = await API.get("/booking/admin/all");
    const bookings = data?.data || data || [];
    console.log("Admin: all bookings:", bookings);
    return Array.isArray(bookings) ? bookings : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch all bookings (admin)");
  }
};

// Allow an admin to cancel any user's booking
export const adminCancelAnyBooking = async (id) => {
  try {
    const { data } = await API.delete(`/booking/admin/cancel/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking as admin");
  }
};

// Retrieve all available washing and drying machines
export const getMachines = async () => {
  try {
    const { data } = await API.get("/machines");
    const machines = data?.data || data || [];
    console.log("Machines fetched:", machines);
    return Array.isArray(machines) ? machines : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch machines");
  }
};

// Add a new machine to the system (admin only)
export const addMachine = async ({ name, code, type, location }) => {
  try {
    console.log("Adding new machine:", { name, code, type, location });
    const { data } = await API.post("/machines", { name, code, type, location });
    console.log("Machine added successfully:", data);
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to add machine");
  }
};

// Delete a machine by its ID (admin only)
export const deleteMachineById = async (id) => {
  try {
    const { data } = await API.delete(`/machines/${id}`);
    console.log("Machine deleted:", id);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to delete machine");
  }
};

// Fetch all users (admin only)
export const getAllUsers = async () => {
  try {
    const { data } = await API.get("/admin/users");
    const users = data?.data || data || [];
    console.log("Admin: users fetched:", users);
    return Array.isArray(users) ? users : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch users");
  }
};

// Approve a user by ID (admin action)
export const approveUserById = async (id) => {
  try {
    const { data } = await API.patch(`/admin/users/${id}/approve`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to approve user");
  }
};

// Delete a user by ID (admin action)
export const deleteUserById = async (id) => {
  try {
    const { data } = await API.delete(`/admin/users/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to delete user");
  }
};

// Toggle a user's role between normal and admin
export const toggleUserRole = async (id) => {
  try {
    const { data } = await API.patch(`/user/toggle-role/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to toggle user role");
  }
};

// Export the configured API instance for shared use
export default API;
