const { Schema, model } = require("mongoose");

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    method: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    province: {
      type: String,
    },
    city: {
      type: String,
    },
    transport: {
      type: String,
    },
    branch: {
      type: String,
    },
    phone: {
      type: String, // ✅ Change to String if phone numbers have leading zeros
    },
    coin: {
      type: Number,
    },
    images: {
      type: [String],
    },
  },
  { timestamps: true }
);
customerSchema.virtual("cardProducts", {
  ref: "cardProducts",
  localField: "_id",
  foreignField: "userId",
});
customerSchema.virtual("customerOrders", {
  ref: "customerOrders",
  localField: "_id",
  foreignField: "customerId",
});
customerSchema.virtual("wishlists", {
  ref: "wishlists",
  localField: "_id",
  foreignField: "userId",
});
customerSchema.virtual("sucesspayments", {
  ref: "sucesspayments",
  localField: "_id",
  foreignField: "sellerId",
});
customerSchema.virtual("FollowingModel", {
  ref: "FollowingModel",
  localField: "_id",
  foreignField: "customers",
});
module.exports = model("customers", customerSchema);
