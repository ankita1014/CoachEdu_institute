import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  // ✅ FIXED: use STRING instead of ObjectId
  studentId: {
    type: String,
    required: true,
  },

  totalFees: {
    type: Number,
    default: 0,
  },

  paid: {
    type: Number,
    default: 0,
  },

  remaining: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    default: "pending",
  },

  installments: [
    {
      amount: Number,
      date: String,
    },
  ],
}, { timestamps: true });

export default mongoose.model("Fees", feeSchema);