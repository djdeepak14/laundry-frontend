require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const WebSocket = require('ws');

const app = express();

// ---------------------
// Environment Variables
// ---------------------
const { MONGO_URI, JWT_SECRET, FRONTEND_URL } = process.env;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) throw new Error('MONGO_URI is not defined in .env');
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in .env');
if (!FRONTEND_URL) throw new Error('FRONTEND_URL is not defined in .env');

// ---------------------
// Allowed Origins
// ---------------------
const allowedOrigins = [
  'http://localhost:3000',
  FRONTEND_URL.replace(/\/$/, ''),
];

console.log('Allowed origins:', allowedOrigins);

// ---------------------
// Middleware
// ---------------------
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', cors());

// ---------------------
// MongoDB Connection
// ---------------------
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
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
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ---------------------
// Routes
// ---------------------
app.get('/', (req, res) => res.send('🚀 Laundry backend is running!'));

app.get('/health', (req, res) => res.json({ status: 'OK', message: 'Server is healthy' }));
app.get('/status', (req, res) => res.json({ status: 'OK', message: 'Server is running' }));

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

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
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bookings routes remain same
// ---------------------------

// ---------------------
// WebSocket Server
// ---------------------
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server, path: '/ws' });
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin?.replace(/\/$/, '') || '';
  if (origin && !allowedOrigins.includes(origin)) return ws.close(1008, 'Origin not allowed');

  ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to WebSocket server' }));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message);
      ws.send(JSON.stringify({ type: 'ECHO', data }));
    } catch {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Unexpected error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});
