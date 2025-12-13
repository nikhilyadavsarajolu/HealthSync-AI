const express = require("express");
const cors = require("cors");

const app = express();

// CORS that supports ALL Vercel preview + prod URLs
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true);

      // Allow localhost
      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      //  Allow ALL Vercel frontend deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      // Block everything else
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/medicines", require("./routes/medicine.routes"));
app.use("/api/donations", require("./routes/donation.routes"));
app.use("/api/ai", require("./routes/ai.routes"));

app.get("/", (req, res) => {
  res.send("HealthSync Backend Running...");
});

module.exports = app;
