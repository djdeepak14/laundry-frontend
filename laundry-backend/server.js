// server.js
require('dotenv').config(); // Load .env

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = express();

// ---------------------
// Middleware
// ---------------------
app.use(cors({
  origin: '*', // Allow all origins, can restrict to frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// ---------------------
// MongoDB Connection
// ---------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------
// Schemas & Models
// ---------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotId: { type: String, required: true },
  machine: { type: String, required: true },
  machineType: { type: String, required: true },
  dayName: { type: String, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  timestamp: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
const Booking = mongoose.model("Booking", bookingSchema);

// ---------------------
// JWT Middleware
// ---------------------
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ---------------------
// Routes
// ---------------------

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Laundry backend is running!");
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid username or password" });

    const token = jwt.sign({ id: user._id, username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get bookings
app.get("/bookings", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create booking
app.post("/bookings", verifyToken, async (req, res) => {
  try {
    const { slotId, machine, machineType, dayName, date, timeSlot, timestamp } = req.body;
    if (!slotId || !machine || !machineType || !dayName || !date || !timeSlot || !timestamp) {
      return res.status(400).json({ message: "All booking fields required" });
    }

    const booking = new Booking({
      userId: req.user.id,
      slotId,
      machine,
      machineType,
      dayName,
      date: new Date(date),
      timeSlot,
      timestamp,
    });

    const saved = await booking.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete booking
app.delete("/bookings/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid booking id" });

  try {
    const booking = await Booking.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!booking) return res.status(404).json({ message: "Booking not found or not authorized" });
    res.json({ message: `Booking ${id} deleted` });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ---------------------
// Start server
// ---------------------
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
