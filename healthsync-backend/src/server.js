// healthsync-backend/src/server.js
require('dotenv').config(); // load env vars from secret file if present
const app = require('./app');
const connectDB = require('./config/db'); // keep your existing DB connector

const PORT = process.env.PORT || 5000;

// Connect to DB (update connectDB implementation to use process.env.MONGO_URL)
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on address ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to DB, exiting:', err);
    process.exit(1);
  });
