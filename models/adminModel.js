const { Schema, model } = require("mongoose");
const adminSchema = new Schema(
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
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      default:"admin"
    },
  },
  { timestamps: true }
);
adminSchema.virtual("transaction", {
  ref: "transaction",
  localField: "_id",
  foreignField: "adminId",
});
module.exports = model("AdminModel", adminSchema);
