const { Schema, model } = require("mongoose");

const sucesspaymentsSchema = new Schema(
  {
    detailsId: {
      type: Schema.ObjectId,
      required: true,
      ref: "customerOrders",
    },
    customerId:{
      type: Schema.ObjectId,
      required: true,
      ref: "customerOrders",
    },
    authId:{
      type: Schema.ObjectId,
      required: true,
      ref: "authorOrders",
    },
    images: {
      type: [String],
      required: true,
    },
    datePayment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = model("sucesspayments", sucesspaymentsSchema);
