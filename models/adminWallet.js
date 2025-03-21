const { Schema, model } = require("mongoose");

const sellerWalletSchema = new Schema(
  {
    sellerId: {
      type: Schema.ObjectId,
      ref: "SellerModel",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("adminWallets", sellerWalletSchema);
