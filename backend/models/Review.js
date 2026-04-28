import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  parentId:  { type: String, required: true },
  studentId: { type: String, required: true },
  name:      { type: String, default: "Parent" },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);
