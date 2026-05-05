import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
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
    enum: ["pending", "partial", "paid"],
    default: "pending",
  },

  // Legacy installment chips (kept for backward compat — date field removed)
  installments: [
    {
      amount: Number,
      // date intentionally removed — no payment dates stored
    },
  ],

  // Structured installment plan set by teacher
  installmentPlan: {
    totalInstallments:        { type: Number, default: 1 },
    firstInstallmentAmount:   { type: Number, default: 0 },
    secondInstallmentAmount:  { type: Number, default: 0 },
    secondInstallmentDueDate: { type: String, default: "" },  // ISO date string "YYYY-MM-DD"
    isFirstPaid:              { type: Boolean, default: false },
    isSecondPaid:             { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.model("Fees", feeSchema);
