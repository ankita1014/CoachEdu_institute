import mongoose from "mongoose";

const homeworkSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    subject: String,
    className: String,
    dueDate: Date,
    teacherId: String,
    teacherName: String,
    attachmentUrl: String,
    attachmentName: String,
    status: {
      type: String,
      default: "pending",
    },
    submissions: [
      {
        studentId: String,
        studentName: String,
        fileUrl: String,
        status: { type: String, default: "pending" },
        marks: Number,
        feedback: String,
        submittedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Homework", homeworkSchema);
