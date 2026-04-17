import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  name: String,
  completed: { type: Boolean, default: false },
});

const skillSchema = new mongoose.Schema({
  name: String,
  status: {
    type: String,
    default: "pending",
  },
  progress: {
    type: Number,
    default: 0,
  },
  chapters: [chapterSchema],
});

const subjectSchema = new mongoose.Schema({
  name: String,
  skills: [skillSchema],
});

export default mongoose.model("Subject", subjectSchema);