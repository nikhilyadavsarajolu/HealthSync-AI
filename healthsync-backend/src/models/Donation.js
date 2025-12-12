const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED"],
      default: "AVAILABLE",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);