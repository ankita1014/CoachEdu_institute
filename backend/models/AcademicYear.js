import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, unique: true, trim: true }, // e.g. "2025-26"
    startDate: { type: Date },
    endDate:   { type: Date },
    isActive:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("AcademicYear", academicYearSchema);
