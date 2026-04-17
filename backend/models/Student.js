import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  password: String,
  class: String,
  parentPhone: String,
  role: {
    type: String,
    default: "student",
  },
});

export default mongoose.model("Student", studentSchema);