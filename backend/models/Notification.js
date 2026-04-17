import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
  {
    studentId: String,
    name: String,
    className: String,
    audience: {
      type: String,
      enum: ["students", "parents", "both"],
      default: "students",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "delivered", "failed"],
      default: "pending",
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["fees", "homework", "test", "general"],
      default: "general",
    },
    audience: {
      type: String,
      enum: ["students", "parents", "both"],
      default: "students",
    },
    recipients: {
      type: [recipientSchema],
      default: [],
    },
    className: {
      type: String,
      default: "All Classes",
    },
    channels: {
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      app: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["sent", "scheduled", "draft", "failed"],
      default: "draft",
    },
    scheduledAt: Date,
    sentAt: Date,
    teacherId: {
      type: String,
      required: true,
      trim: true,
    },
    teacherName: {
      type: String,
      default: "",
    },
    deliverySummary: {
      delivered: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
