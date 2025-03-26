const { Schema, model } = require("mongoose");

const customerOrder = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "customers",
      required: true,
    },
    products: {
      type: Array, //[]
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
    code_payment: {
      type: Number,
      required: true,
    },
    shippingInfo: {
      type: Object, //{}
      required: true,
    },
    delivery_status: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    couponCode: {
      type: String,
    },
    expiresAt: { type: Date, required: true }, // เวลา Order หมดอายุ
  },
  { timestamps: true }
);
customerOrder.virtual("wishlists", {
  ref: "wishlists",
  localField: "_id",
  foreignField: "userId",
});
customerOrder.virtual("sucesspayments", {
  ref: "sucesspayments",
  localField: "_id",
  foreignField: "detailsId",
});
customerOrder.virtual("authorOrders", {
  ref: "authorOrders",
  localField: "_id",
  foreignField: "orderId",
});

module.exports = model("customerOrders", customerOrder);
