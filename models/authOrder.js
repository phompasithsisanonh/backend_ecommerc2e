const { Schema, model } = require("mongoose");

const authSchema = new Schema(
  {
    orderId: {
      type: Schema.ObjectId,
      required: true,
      ref:'customerOrders'
    },
    sellerId: {
      type: Schema.ObjectId,
      required: true,
      ref: "SellerModel",
    },
  
    products: {
      type: Array,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
    },
    shippingInfo: {
      type: String,
      required: true,
    },
    delivery_status: {
      type: String,
      required: true,
    },
    code_payment:{
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    total_real_money:{
      type: Number,
    },
    commission:{
      type: Number,
    },
    couponCode:{
      type: String,
    },
    expiresAt: { type: Date, required: true }, // เวลา Order หมดอายุ
  },
  { timestamps: true }
);
authSchema.virtual("sucesspayments", {
  ref: "sucesspayments",
  localField: "_id",
  foreignField: "authId",
});
module.exports = model("authorOrders", authSchema);
