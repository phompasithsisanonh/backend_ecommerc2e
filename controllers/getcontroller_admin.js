const seller = require("../models/sellerModel");
// redisClient
const get_seller_admin = async (req, res) => {
  // const cacheKey = "all_sellers";

  try {
    // 1. ตรวจสอบใน Redis โดยไม่ใช้ promisify
    // const cachedSellers = await redisClient.get(cacheKey);
    // if (cachedSellers) {
    //   console.log("Cache hit: Fetching sellers from Redis");
    //   return res.status(200).json({
    //     success: true,
    //     data: JSON.parse(cachedSellers),
    //   });
    // }

    // 2. ถ้าไม่มีใน cache ดึงจาก MongoDB
    // console.log("Cache miss: Fetching from MongoDB");
    const findI = await seller.find({});

    // 3. เก็บใน Redis (TTL = 1 ชั่วโมง)
    // await redisClient.set(cacheKey, JSON.stringify(findI), { EX: 3600 });

    res.status(200).json({
      success: true,
      data: findI,
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers",
      error: error.message,
    });
  }
};
module.exports.get_seller_admin = get_seller_admin;
