/**
 * cloudinaryUpload.js
 * Shared utility: multer memory storage + Cloudinary stream upload
 * Works for materials, homework attachments, and student submissions
 */

import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

// ── Multer — memory storage (no disk writes) ──────────────────────────────────
export const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF, DOC, DOCX, JPG, PNG files are allowed"));
  },
});

// ── Upload buffer to Cloudinary ───────────────────────────────────────────────
// folder: "materials" | "homework" | "student-homework"
export const uploadToCloudinary = (buffer, folder, originalName) =>
  new Promise((resolve, reject) => {
    const publicId = `${Date.now()}-${originalName.replace(/\s+/g, "-").replace(/\.[^/.]+$/, "")}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "raw", // handles PDFs and docs
        use_filename: false,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });

// ── Delete a file from Cloudinary by its URL ─────────────────────────────────
export const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl || !fileUrl.includes("cloudinary.com")) return; // skip local/old URLs
  try {
    // Extract public_id from URL: folder/publicId (no extension for raw)
    const parts = fileUrl.split("/upload/")[1];
    if (!parts) return;
    // Remove version segment (v1234567/) if present
    const withoutVersion = parts.replace(/^v\d+\//, "");
    // Remove file extension for raw resources
    const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (err) {
    console.error("[cloudinary] Delete failed:", err.message);
  }
};
