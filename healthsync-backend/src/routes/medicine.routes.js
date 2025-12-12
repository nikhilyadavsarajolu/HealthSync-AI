const express = require("express");
const auth = require("../middleware/auth");
const Medicine = require("../models/Medicines");

const router = express.Router();

//POST /api/medicines
router.post("/", auth, async (req, res) => {
  try {
    const { name, brand, quantity, expiryDate, isSealed, photoUrl } = req.body;

    if (!name || !expiryDate) {
      return res.status(400).json({ message: "Name and expiry date required" });
    }

    const medicine = await Medicine.create({
      user: req.user.id,
      name,
      brand,
      quantity,
      expiryDate,
      isSealed,
      photoUrl,
    });

    return res.status(201).json({
      message: "Medicine added successfully", medicine
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

//GET /api/medicines
router.get("/", auth, async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user.id }).sort({ createdAt: -1});

    return res.json(medicines);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

//GET /api/medicines/expiring-soon
router.get("/expiring-soon", auth, async (req, res) => {
  try {
    const today = new Date();
    const next30 = new Date();
    next30.setDate(today.getDate() + 30);

    const medicines = await Medicine.find({
      user: req.user.id,
      expiryDate: { $gte: today, $lte: next30 },
      status: "ACTIVE",
    });

    return res.json(medicines);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
   }
});

//PATCH /api/medicines/:id
router.patch("/:id", auth, async (req, res) => {
  try {
    const updates = req.body;

    const medicine = await Medicine.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, updates, { new: true });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    return res.json({
      message: "Medicine updated",
      medicine,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

//DELETE /api/medicines/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!medicine) {
      return res.status(400).json({ message: "Medicine not found" });
    }
    return res.json({ message: "Medicine deleted "});
  } catch (err) {
    return res.status(500).json({ message: "Server error" })
  }
})

module.exports = router;