const { Schema, model } = require("mongoose");
const SellerCustomerModelSchema = new Schema(
  {
    myId: {
      type: String,
      required: true,
    },
    myFriend: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = model("SellerCustomerModel", SellerCustomerModelSchema);
