const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerModel",
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminModel",
    },
    images:{
      type: [String],
    },
    messageWhy:{
      type: String,
    },
    code_payments_seller:{
      type: Number,
      require: true,
    },
    bank: {
      type: String,
      enum: [
        "ທະນາຄານການຄ້າຕ່າງປະເທດລາວ (BCEL)",
        "ທະນາຄານພັດທະນາລາວ (LDB BANK)",
      ],
    },
    seller_name_bank: {
      type: String,
      require: true,
    },
    seller_account_bank_number: {
      type: Number,
      require: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["completed", "pending", "cancel"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transaction", transactionSchema);
