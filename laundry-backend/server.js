require('dotenv').config(); // Load .env

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const WebSocket = require('ws');

const app = express();

// ---------------------
// Environment Validation
// ---------------------
const { MONGO_URI, JWT_SECRET, FRONTEND_URL, PORT = 3002 } = process.env;
if (!MONGO_URI) throw new Error('MONGO_URI is not defined in .env');
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in .env');
if (!FRONTEND_URL) throw new Error('FRONTEND_URL is not defined in .env');

const allowedOrigins = [
  'http://localhost:3000', // Local dev
  FRONTEND_URL, // Production frontend (e.g., https://sevas-laundry.onrender.com)
];

// ---------------------
// Middleware
// ---------------------
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: (origin, callback) => {
      console.log(`Request origin: ${origin || 'none'}`);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies if needed
  })
);
app.use(express.json()); // Parse JSON bodies

// ---------------------
// MongoDB Connection
// ---------------------
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    w: 'majority',
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ---------------------
// Schemas & Models
// ---------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
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

const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// ---------------------
// JWT Middleware
// ---------------------
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.warn('No token provided in request');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ---------------------
// Routes
// ---------------------

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Laundry backend is running!');
});

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      console.warn('Missing username or password in register request');
      return res.status(400).json({ message: 'Username and password required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.warn(`User ${username} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    console.log(`User ${username} registered successfully`);
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      console.warn('Missing username or password in login request');
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.warn(`Login failed: User ${username} not found`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: Incorrect password for ${username}`);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`Login successful for ${username}`);
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get bookings
app.get('/bookings', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id });
    res.json(bookings);
  } catch (err) {
    console.error('Get bookings error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create booking
app.post('/bookings', verifyToken, async (req, res) => {
  try {
    const { slotId, machine, machineType, dayName, date, timeSlot, timestamp } = req.body;
    if (!slotId || !machine || !machineType || !dayName || !date || !timeSlot || !timestamp) {
      console.warn('Missing booking fields in request');
      return res.status(400).json({ message: 'All booking fields required' });
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
    console.log(`Booking created for user ${req.user.id}`);
    res.json(saved);
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete booking
app.delete('/bookings/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn(`Invalid booking ID: ${id}`);
    return res.status(400).json({ message: 'Invalid booking ID' });
  }

  try {
    const booking = await Booking.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!booking) {
      console.warn(`Booking ${id} not found or not authorized for user ${req.user.id}`);
      return res.status(404).json({ message: 'Booking not found or not authorized' });
    }
    console.log(`Booking ${id} deleted for user ${req.user.id}`);
    res.json({ message: `Booking ${id} deleted` });
  } catch (err) {
    console.error('Delete booking error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ---------------------
// WebSocket Server
// ---------------------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`API available at http://0.0.0.0:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  console.log(`WebSocket connection attempt from: ${origin || 'none'}`);
  if (!allowedOrigins.includes(origin)) {
    console.warn(`WebSocket connection rejected: Invalid origin ${origin}`);
    ws.close(1008, 'Origin not allowed');
    return;
  }

  console.log('WebSocket client connected');
  ws.on('message', (message) => {
    console.log(`Received WebSocket message: ${message}`);
    ws.send(`Echo: ${message}`); // Example: echo back (customize as needed)
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// ---------------------
// Error Handling Middleware
// ---------------------
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});