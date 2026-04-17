import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // 🔥 ADD THIS
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: { type: String, required: true, unique: true },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },

  phone: { type: String, required: true },

  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    default: 'student',
  },

  // 🔥 OTP FIELDS
  otp: String,
  otpExpiry: Date,

  createdAt: { type: Date, default: Date.now },
});

// 🔥 HASH PASSWORD
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔥 COMPARE PASSWORD
userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// 🔥 OTP GENERATOR
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export default mongoose.model('User', userSchema);