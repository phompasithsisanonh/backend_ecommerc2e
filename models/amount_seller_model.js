const mongoose = require("mongoose");

const amountSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ยอดขายรวม
    totalSales: { type: Number, default: 0 },
    // ยอดเงินที่สามารถถอนออกได้
    availableAmount: { type: Number, default: 0 },
    // ยอดเงินที่ถอนออกไปแล้ว
    withdrawnAmount: { type: Number, default: 0 },
    // ยอดเงินที่ยังรอดำเนินการ
    pendingAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Amount", amountSchema);
