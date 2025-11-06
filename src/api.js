import axios from "axios";

/* ===========================================
   🔧 API Configuration
   =========================================== */
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
  withCredentials: true,
});

/* ===========================================
   🛡️ Interceptors — Attach Token + Handle Auth Errors
   =========================================== */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(
      `➡️ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      config.data ? JSON.stringify(config.data) : ""
    );
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message?.toLowerCase() || "";
    if (error.response?.status === 401 && message.includes("invalid")) {
      console.warn("⚠️ Invalid or expired token — logging out...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ===========================================
   ⚙️ Global Error Handler
   =========================================== */
const handleError = (err, defaultMessage) => {
  const message =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    defaultMessage ||
    "An unknown error occurred.";

  console.error(`❌ ${defaultMessage}:`, message);
  throw new Error(message);
};

/* ===========================================
   👤 AUTHENTICATION
   =========================================== */
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
    throw handleError(err, "Logout failed");
  }
};

/* ===========================================
   ⚖️ GDPR — Account Deletion Request
   =========================================== */
export const requestAccountDeletion = async () => {
  try {
    const response = await API.post("/user/request-deletion");
    console.log("🧾 GDPR: Account deletion request submitted:", response.data);
    return response;
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || "";

    if (status === 400 || status === 409 || msg.includes("already requested")) {
      console.warn("⚠️ Account deletion already requested.");
      return { status: 409, message: "You have already requested account deletion." };
    }

    throw handleError(
      err,
      "Failed to request account deletion. Please try again later."
    );
  }
};

/* ===========================================
   🧺 BOOKINGS
   =========================================== */
export const getBookings = async () => {
  try {
    const { data } = await API.get("/booking");
    const bookings = data?.data || data || [];
    console.log("📅 Bookings fetched:", bookings);
    return Array.isArray(bookings) ? bookings : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch bookings");
  }
};

export const createBooking = async (booking) => {
  try {
    const { data } = await API.post("/booking", booking);
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to create booking");
  }
};

export const cancelBooking = async (id) => {
  try {
    const { data } = await API.delete(`/booking/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking");
  }
};

/* ===========================================
   🧾 ADMIN BOOKING MANAGEMENT
   =========================================== */
export const adminGetAllBookings = async () => {
  try {
    const { data } = await API.get("/booking/admin/all");
    const bookings = data?.data || data || [];
    console.log("🧾 Admin: all bookings:", bookings);
    return Array.isArray(bookings) ? bookings : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch all bookings (admin)");
  }
};

export const adminCancelAnyBooking = async (id) => {
  try {
    const { data } = await API.delete(`/booking/admin/cancel/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to cancel booking as admin");
  }
};

/* ===========================================
   🧠 MACHINES
   =========================================== */
export const getMachines = async () => {
  try {
    const { data } = await API.get("/machines");
    const machines = data?.data || data || [];
    console.log("⚙️ Machines fetched:", machines);
    return Array.isArray(machines) ? machines : [];
  } catch (err) {
    throw handleError(err, "Failed to fetch machines");
  }
};

/**
 * ✅ Add a new machine (Admin only)
 * Requires: name, code, type, optional location
 */
export const addMachine = async ({ name, code, type, location }) => {
  try {
    console.log("🧠 Adding new machine:", { name, code, type, location });
    const { data } = await API.post("/machines", { name, code, type, location });
    console.log("✅ Machine added successfully:", data);
    return data?.data || data;
  } catch (err) {
    throw handleError(err, "Failed to add machine");
  }
};

/**
 * ✅ Delete machine by ID (Admin only)
 */
export const deleteMachineById = async (id) => {
  try {
    const { data } = await API.delete(`/machines/${id}`);
    console.log("🗑️ Machine deleted:", id);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to delete machine");
  }
};

/* ===========================================
   👥 ADMIN USER MANAGEMENT
   =========================================== */
export const getAllUsers = async () => {
  try {
    const { data } = await API.get("/admin/users");
    const users = data?.data || data || [];
    console.log("👥 Admin: users fetched:", users);
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

export const toggleUserRole = async (id) => {
  try {
    const { data } = await API.patch(`/user/toggle-role/${id}`);
    return data;
  } catch (err) {
    throw handleError(err, "Failed to toggle user role");
  }
};

export default API;
