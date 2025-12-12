const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      default: 1,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    isSealed: {
      type: Boolean,
      default: true,
    },

    photoUrl: {
      type: String,
      default: null,
    },

    // ------------------------------
    // 🚀 NEW SAFETY FEATURES
    // ------------------------------

    requiresPrescription: {
      type: Boolean,
      default: false, // AI will set this based on scan OR user manual selection
    },

    prescriptionImageUrl: {
      type: String,
      default: null, // uploaded prescription photo (if needed)
    },

    prescriptionVerified: {
      type: Boolean,
      default: false, // admin/AI will set this true after checking prescription
    },

    prescriptionVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // admin user ID
    },

    prescriptionVerifiedAt: {
      type: Date,
      default: null,
    },

    // ------------------------------

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "ACTIVE",
    },

    isDonatable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
