import express from "express";
import AcademicYear from "../models/AcademicYear.js";

const router = express.Router();

// Default years to seed if none exist
const DEFAULT_YEARS = [
  { name: "2024-25", startDate: new Date("2024-06-01"), endDate: new Date("2025-05-31"), isActive: false },
  { name: "2025-26", startDate: new Date("2025-06-01"), endDate: new Date("2026-05-31"), isActive: true  },
  { name: "2026-27", startDate: new Date("2026-06-01"), endDate: new Date("2027-05-31"), isActive: false },
];

// GET /api/academic-years
// Returns all years; auto-seeds defaults if collection is empty
router.get("/", async (_req, res) => {
  try {
    let years = await AcademicYear.find().sort({ startDate: -1 });

    if (years.length === 0) {
      years = await AcademicYear.insertMany(DEFAULT_YEARS);
    }

    res.json({ success: true, data: years });
  } catch (err) {
    console.error("ACADEMIC_YEAR_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/academic-years
// Create a new academic year
router.post("/", async (req, res) => {
  try {
    const { name, startDate, endDate, isActive } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "name is required" });
    }
    const existing = await AcademicYear.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Year "${name}" already exists` });
    }
    const year = await AcademicYear.create({ name: name.trim(), startDate, endDate, isActive: !!isActive });
    res.status(201).json({ success: true, data: year });
  } catch (err) {
    console.error("ACADEMIC_YEAR_CREATE_ERROR:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
