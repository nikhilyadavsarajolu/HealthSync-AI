const express = require('express');
const auth = require('../middleware/auth');
const Medicine = require('../models/Medicines');
const Donation = require('../models/Donation');
const DonationRequest = require("../models/DonationRequest");
const User = require("../models/User");

const router = express.Router();

// Owner marks a medicine as donatable
// POST /api/donations/:medicineId
router.post("/:medicineId", auth, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const force = req.body?.force === true || req.query?.force === "true";

    // find medicine owned by current user
    const medicine = await Medicine.findOne({
      _id: medicineId,
      user: req.user.id,
    });

    if (!medicine) {
      return res.status(404).json({ code: "MEDICINE_NOT_FOUND", message: "Medicine not found" });
    }

    // Normalize dates for expiry comparison
    const today = new Date();
    today.setHours(0,0,0,0);
    if (medicine.expiryDate) {
      const exp = new Date(medicine.expiryDate);
      exp.setHours(0,0,0,0);
      if (exp < today) {
        return res.status(400).json({ code: "EXPIRED", message: "Cannot donate expired medicine" });
      }
    }

    // already donatable?
    if (medicine.isDonatable) {
      return res.status(400).json({ code: "ALREADY_DONATABLE", message: "Medicine is already marked as donatable" });
    }

    // prescription requirement check (cannot be forced)
    if (medicine.requiresPrescription && !medicine.prescriptionVerified) {
      return res.status(400).json({
        code: "PRESCRIPTION_REQUIRED",
        message: "This medicine requires a valid prescription before it can be donated. Upload prescription and wait for verification.",
      });
    }

    // sealed check (policy) -> allow forcing with explicit confirmation
    if (!medicine.isSealed && !force) {
      return res.status(400).json({
        code: "UNSEALED_REQUIRE_FORCE",
        message: "This medicine is unsealed. If you still want to proceed, call this endpoint again with { force: true } after confirming the risk.",
      });
    }

    // Create Donation entry
    const donation = await Donation.create({
      medicine: medicine._id,
      owner: req.user.id,
      status: "AVAILABLE",
    });

    // Mark medicine as donatable
    medicine.isDonatable = true;
    await medicine.save();

    // Return populated donation (owner + medicine)
    const populated = await Donation.findById(donation._id)
      .populate({
        path: "medicine",
        populate: { path: "user" },
      })
      .populate("owner");

    return res.status(201).json({ message: "Medicine marked as available for donation", donation: populated });
  } catch (err) {
    console.error("Create donation error:", err);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Server error" });
  }
});

// Get my donations (Owner side)
// GET /api/donations/my
router.get("/my", auth, async (req, res) => {
  try {
    const donations = await Donation.find({ owner: req.user.id })
      .populate({
        path: "medicine",
        populate: { path: "user" },
      })
      .sort({ createdAt: -1 });
    return res.json(donations);
  } catch (err) {
    console.error("Get my donations error:", err.message);
    return res.status(500).json({ message: "server error" });
  }
});

// GET /api/donations/nearby
router.get("/nearby", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser || (!currentUser.city && !currentUser.pincode)) {
      return res.status(400).json({
        message: "User city or pincode required to find nearby donations",
      });
    }

    // Find donations from other users that are AVAILABLE
    const donations = await Donation.find({
      owner: { $ne: req.user.id },
      status: "AVAILABLE",
    })
      .populate("medicine")
      .populate("owner");

    // Simple filter by same city or same pincode
    const nearby = donations.filter((d) => {
      const owner = d.owner;
      if (!owner) return false;

      const samePincode =
        owner.pincode && currentUser.pincode && owner.pincode === currentUser.pincode;

      const sameCity =
        owner.city &&
        currentUser.city &&
        owner.city.toLowerCase() === currentUser.city.toLowerCase();

      return samePincode || sameCity;
    });

    return res.json(nearby);
  } catch (err) {
    console.error("Get nearby donations error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Request a donation
// POST /api/donations/:donationId/requests
router.post("/:donationId/requests", auth, async (req, res) => {
  try {
    const { donationId } = req.params;
    const { message } = req.body;

    const donation = await Donation.findById(donationId).populate("owner");

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (String(donation.owner._id) === req.user.id) {
      return res.status(400).json({ message: "You cannot request your own donation" });
    }

    if (donation.status !== "AVAILABLE") {
      return res.status(400).json({ message: "Donation is not available for requests" });
    }

    // Check if already requested
    const existingRequest = await DonationRequest.findOne({
      donation: donationId,
      requester: req.user.id,
      status: { $in: ["PENDING", "ACCEPTED"] },
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a request for this donation" });
    }

    const request = await DonationRequest.create({
      donation: donationId,
      requester: req.user.id,
      message: message || "",
    });

    // Optionally mark donation as "REQUESTED"
    donation.status = "REQUESTED";
    await donation.save();

    return res.status(201).json({
      message: "Donation request created",
      request,
    });
  } catch (err) {
    console.error("Create donation request error", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET my received requests (I am Owner)
// GET /api/donations/requests/received
router.get("/requests/received", auth, async (req, res) => {
  try {
    // Find donations that belong to current user
    const myDonations = await Donation.find({ owner: req.user.id }).select("_id");
    const donationIds = myDonations.map((d) => d._id);

    const requests = await DonationRequest.find({
      donation: { $in: donationIds },
    })
      .populate({
        path: "donation",
        populate: { path: "medicine" },
      })
      .populate("requester")
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (err) {
    console.error("Get received requests error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET my sent requests (I am requester)
// GET /api/donations/requests/sent
router.get("/requests/sent", auth, async (req, res) => {
  try {
    const requests = await DonationRequest.find({ requester: req.user.id })
      .populate({
        path: "donation",
        populate: { path: "medicine owner" },
      })
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (err) {
    console.error("Get sent requests error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Accept or Reject a request
// PATCH /api/donations/requests/:id
// body: { status: "ACCEPTED" | "REJECTED" }
router.patch("/requests/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["ACCEPTED", "REJECTED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status must be ACCEPTED or REJECTED" });
    }

    let request = await DonationRequest.findById(req.params.id).populate({
      path: "donation",
      populate: { path: "medicine owner" },
    }).populate("requester");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // only owner of donation can update
    const donationOwnerId = String(request.donation.owner._id || request.donation.owner);
    if (donationOwnerId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this request" });
    }

    request.status = status;
    await request.save();

    // Also update donation status
    const donation = await Donation.findById(request.donation._id);

    if (status === "ACCEPTED") {
      donation.status = "ACCEPTED";
      // Optionally: mark medicine as not donatable now that it's accepted
      await Medicine.findByIdAndUpdate(donation.medicine, { isDonatable: false });
    } else if (status === "REJECTED") {
      const otherPending = await DonationRequest.findOne({ donation: donation._id, status: "PENDING" });
      donation.status = otherPending ? "REQUESTED" : "AVAILABLE";
    }

    await donation.save();

    // Re-fetch the request with fresh population (owner contact included)
    const populatedRequest = await DonationRequest.findById(request._id)
      .populate({
        path: "donation",
        populate: { path: "medicine owner" },
      })
      .populate("requester");

    return res.json({ message: "Request updated", request: populatedRequest });
  } catch (err) {
    console.error("Update request error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
