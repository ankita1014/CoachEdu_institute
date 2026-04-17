import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mcq", "descriptive"],
      default: "mcq",
    },
    question: String,
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      default: "",
    },
    marks: {
      type: Number,
      default: 1,
    },
  },
  { _id: true }
);

const submissionSchema = new mongoose.Schema(
  {
    studentId: String,
    studentName: String,
    status: {
      type: String,
      enum: ["pending", "submitted", "evaluated"],
      default: "pending",
    },
    score: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
    submittedAt: Date,
    answers: [
      {
        questionId: String,
        answer: String,
        isCorrect: Boolean,
      },
    ],
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: String,
    subject: String,
    className: String,
    totalMarks: Number,
    duration: Number,
    dueDate: Date,
    teacherId: String,
    teacherName: String,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    submissions: {
      type: [submissionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Test || mongoose.model("Test", testSchema);
