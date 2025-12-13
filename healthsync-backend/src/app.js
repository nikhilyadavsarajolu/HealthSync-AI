const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: [
      "https://healthsync-frontend.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Allow preflight requests
app.options("*", cors());

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
