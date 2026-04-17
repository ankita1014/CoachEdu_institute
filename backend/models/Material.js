import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    teacherId: {
      type: String,
      required: true,
      trim: true,
    },
    teacherName: {
      type: String,
      trim: true,
      default: "",
    },
    storageProvider: {
      type: String,
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Material ||
  mongoose.model("Material", materialSchema);
