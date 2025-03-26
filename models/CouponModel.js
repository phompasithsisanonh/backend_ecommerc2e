const { Schema, model } = require("mongoose");
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // รหัสคูปอง ต้องไม่ซ้ำ
    type: { type: String, enum: ["percentage", "fixed"], required: true }, // ประเภทคูปอง (ลดเป็น % หรือจำนวนเงิน)
    value: { type: Number, required: true }, // มูลค่าส่วนลด (ตัวเลข)
    minPurchase: { type: Number, default: 0 }, // ยอดซื้อขั้นต่ำ
    maxDiscount: { type: Number, default: null }, // จำนวนลดสูงสุด (ถ้าเป็น %)
    startDate: { type: Date, required: true }, // วันที่เริ่มใช้คูปองได้
    endDate: { type: Date, required: true }, // วันที่หมดอายุ
    status: {
      type: String,
      enum: ["active", "expired", "disabled"],
      default: "active",
    }, // สถานะคูปอง
    usageLimit: { type: Number, default: 0 }, // จำนวนครั้งที่ใช้ได้ทั้งหมด (0 = ไม่จำกัด)
    usageCount: { type: Number, default: 0 }, // จำนวนครั้งที่ถูกใช้ไปแล้ว
    applicableCategories: { type: [String], default: [] }, // หมวดหมู่สินค้าที่ใช้คูปองได้
    applicableProducts: { type: [String], default: [] }, // รายการสินค้าที่ใช้คูปองได้
  },
  { timestamps: true }
); // timestamps = เพิ่ม createdAt & updatedAt
couponSchema.virtual("customerOrders", {
  ref: "customerOrders",
  localField: "_id",
  foreignField: "couponCode",
});
module.exports = model("CouponModel", couponSchema);
