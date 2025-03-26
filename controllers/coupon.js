const Coupon = require("../models/CouponModel");
const Products = require("../models/productModel");
/////admin_add_coupon
const couponAdd = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      status,
      usageLimit,
      usageCount,
      applicableCategories,
      applicableProducts,
    } = req.body;

    const coupon = new Coupon({
      admin: req.id,
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      status,
      usageLimit,
      usageCount,
      applicableCategories,
      applicableProducts,
    });
    await coupon.save();
    res.status(201).json({ message: "Coupon added successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

////user_addd_coupon
const applyCoupon = async (req, res) => {
  try {
    const { code, idproducts } = req.body;

    const coupon = await Coupon.findOne({ code });
    const find_products = await Products.find({ _id: { $in: idproducts } });
    // รวมราคาสินค้าทั้งหมด
    const total_price = find_products.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    if (total_price < coupon.minPurchase) {
      return res.status(400).json({
        message: "ຊື້ຂັ້ນຕໍ່າ " + coupon.minPurchase,
      });
    }
    // // ตรวจสอบว่าคูปองมีอยู่จริงหรือไม่
    if (!coupon) {
      return res.status(400).json({
        message: "ບໍ່ມີຄູປອງ",
      });
    }
    if (coupon.active === "none") {
      return res.status(400).json({
        message: "ຄູປອງໃຊ້ບໍ່ໄດ້",
      });
    }
    if (coupon.endDate < new Date()) {
      return res.status(400).json({
        message: "ຄູປອງສ່ວນຫລຸດໝົດອາຍຸແລ້ວ",
      });
    }

    // // ตรวจสอบว่าสินค้าสามารถใช้คูปองได้หรือไม่
    const isValidForAnyProduct =
      !coupon.applicableProducts ||
      coupon.applicableProducts.length === 0 ||
      idproducts.some((product) => coupon.applicableProducts.includes(product));

    if (!isValidForAnyProduct) {
      return res.status(400).json({
        message: "ສິິນຄ້ານີ້ບໍ່ມີຄູປອງສ່ວນຫລຸດ",
      });
    }

    // // ตรวจสอบ usageLimit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    return res.status(200).json({ message: "ໄດ້ຮັບສ່ວນຫລຸດ", data: coupon });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// redisClient
const get_all_coupon = async (req, res) => {
  try {
    // const cacheKey = "get_all_coupon"; // Redis cache key

    // // เช็คว่า Redis พร้อมใช้งานหรือไม่
    // if (!redisClient) {
    //   console.error("Redis client is not connected");
    // }

    // // 1. ตรวจสอบ Redis Cache แบบ async
    // const cachedDataPromise = redisClient?.get(cacheKey);

    // 2. ตรวจสอบข้อมูลจาก Database แบบ async
    const findCouponPromise = Coupon.find({}).lean();

    // 3. ใช้ Promise.all เพื่อทำให้ทั้งสองทำงานพร้อมกัน
    const [findCoupon] = await Promise.all([
      cachedDataPromise,
      findCouponPromise,
    ]);

    // if (cachedData) {
    //   return res.status(200).json({
    //     success: true,
    //     data: JSON.parse(cachedData),
    //     source: "cache",
    //   });
    // }
    // res.status(200).json({
    //   success: true,
    //   data: JSON.parse(cachedData),
    //   source: "cache",
    // });
    // 4. Store in Redis with expiration (set EX: 60 for 1 minute cache)
    // if (redisClient) {
    //   redisClient.set(cacheKey, JSON.stringify(findCoupon), { EX: 60 });
    // }

    // 5. ส่งข้อมูลจาก Database
    res.status(200).json({
      success: true,
      data: findCoupon,
      source: "database",
    });
  } catch (err) {
    console.error("Error fetching coupons:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateCoupon = async (couponId, couponData) => {
  try {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return { success: false, message: "Coupon not found" };
    }

    // Update the coupon with the new data
    Object.assign(coupon, couponData);
    await coupon.save();
    return { success: true, message: "Coupon updated successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
// The main function to handle editing a coupon
const couponEdit = async (req, res) => {
  try {
    const {
      couponId, // ID of the coupon to be edited
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      status,
      usageLimit,
      usageCount,
      applicableCategories,
      applicableProducts,
    } = req.body;

    const couponData = {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      status,
      usageLimit,
      usageCount,
      applicableCategories,
      applicableProducts,
    };

    // Call the helper function to update the coupon
    const result = await updateCoupon(couponId, couponData);

    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
module.exports.couponAdd = couponAdd;
module.exports.applyCoupon = applyCoupon;
module.exports.get_all_coupon = get_all_coupon;
module.exports.couponEdit = couponEdit;
// const cron = require("node-cron");
// const customerOrder = require("../models/customerOrder");
// const authOrder = require("../models/authOrder");
// "*/5 * * * *" หมายถึง ทุกๆ 5 นาที
//"*/30 * * * * *" ซึ่งหมายถึง ทุก 30 วินาที
// cron.schedule("*/1 * *  * *", async () => {
//   console.log("🔄 Checking for unpaid orders...");

//   const expiredTime = new Date();
//   expiredTime.setMinutes(expiredTime.getMinutes() + 1); // 30 นาที

//   const unpaidOrders = await customerOrder.find({
//     payment_status: "ລໍຖ້າ", // คำสั่งซื้อค้างชำระ
//     createdAt: { $lte: expiredTime },
//   });
//   const unpaidauthOrders = await authOrder.find({
//     payment_status: "ລໍຖ້າ", // คำสั่งซื้อค้างชำระ
//     createdAt: { $lte: expiredTime },
//   });
//   //   // คืนค่า usageCount ของคูปอง
//   if (unpaidOrders.length > 0 || unpaidauthOrders.length > 0) {
//     await Coupon.updateOne(
//       { $inc: { usageCount: -1, usageLimit: +1 } } // ลดค่าการใช้งานลง 1
//     );
//     await customerOrder.deleteMany({
//       payment_status: "ລໍຖ້າ",
//       createdAt: { $lte: expiredTime },
//     });
//     await authOrder.deleteMany({
//       payment_status: "ລໍຖ້າ",
//       createdAt: { $lte: expiredTime },
//     });
//   }
// });
