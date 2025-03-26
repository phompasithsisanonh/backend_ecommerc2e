const authOrder = require("../models/authOrder");
const products = require("../models/productModel");
// redisClient
const dashbord_admin = async (req, res) => {
  try {
    //  const cacheKey = "admin_dashboard"; // ชื่อ key ที่สื่อความหมาย

    // // // 1. ตรวจสอบใน Redis
    // const cachedData = await redisClient.get(cacheKey);
    // if (cachedData) {
    //   console.log("Cache hit: Fetching dashboard from Redis");
    //   return res.status(200).json({
    //     success: true,
    //     data: JSON.parse(cachedData),
    //     source: "cache",
    //   });
    // }

    // // // 2. ถ้าไม่มีใน cache ดึงจาก MongoDB
    // console.log("Cache miss: Fetching from MongoDB");

    // ดึงออเดอร์ที่จ่ายแล้ว
    const paidOrders = await authOrder.find({ payment_status: "ຈ່າຍແລ້ວ" });

    // รวมยอดขายและจำนวนออเดอร์แยกตาม seller และวันที่
    const total_sales = await authOrder.aggregate([
      {
        $match: { payment_status: "ຈ່າຍແລ້ວ" },
      },
      {
        $group: {
          _id: {
            sellerId: "$sellerId",
            date: { $dateToString: { format: "%d", date: "$createdAt" } },
            month: { $dateToString: { format: "%m", date: "$createdAt" } },
            year: { $dateToString: { format: "%Y", date: "$createdAt" } },
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // ดึงสินค้าทั้งหมด
    const all_products = await products.find({});

    // ดึงออเดอร์ที่รอดำเนินการ
    const pendingOrders = await authOrder.find({ payment_status: "ລໍຖ້າ" });

    // ข้อมูลที่จะส่งกลับ
    const dashboardData = {
      paid_orders: paidOrders,
      total_sales: total_sales,
      pending_orders: pendingOrders,
      all_products: all_products,
    };

    // // 3. เก็บใน Redis (TTL = 5 นาที หรือ 300 วินาที)
    //  await redisClient.set(cacheKey, JSON.stringify(dashboardData), { EX:  300 });

    res.status(200).json({
      success: true,
      data: dashboardData,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

module.exports.dashbord_admin = dashbord_admin;
