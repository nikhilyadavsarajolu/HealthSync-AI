// healthsync-backend/src/app.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const medicineRoutes = require('./routes/medicine.routes');
const donationRoutes = require('./routes/donation.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// Secure CORS: read allowed origin from env, allow localhost for dev
// Set FRONTEND_URL in Render (example: https://your-frontend.vercel.app)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',   // vite preview / local dev
  'http://localhost:3000',   // other local dev ports if used
];

// CORS middleware with dynamic origin check
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin like Postman, mobile apps, curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: access from origin ${origin} is not allowed.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('HealthSync Backend Running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ai', aiRoutes);

module.exports = app;
