
const express = require("express");
const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
];

// Custom CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow only whitelisted origins
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});


app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const medicineRoutes = require("./routes/medicine.routes");
const donationRoutes = require("./routes/donation.routes");
const aiRoutes = require("./routes/ai.routes");

app.get("/", (req, res) => {
  res.send("HealthSync Backend Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/ai", aiRoutes);

module.exports = app;
