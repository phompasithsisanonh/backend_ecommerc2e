const { Schema, model } = require("mongoose");
const sellerModel = require("./sellerModel");

const followingModelSchema = new Schema(
  {
    customers: {
      type: Schema.Types.ObjectId,
      ref: "customers",
      required: true,
    },
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "SellerModel",
      },
    ],
  },
  { timestamps: true }
);




//เพื่อประสิทธิภาพที่ดีขึ้นในกรณีที่ฐานข้อมูลมีขนาดใหญ่, คุณอาจต้องการเพิ่ม index ให้กับฟิลด์ที่ใช้ในการค้นหา
followingModelSchema.index({ userId: 1 });
followingModelSchema.index({ following: 1 });

module.exports = model("FollowingModel", followingModelSchema);
