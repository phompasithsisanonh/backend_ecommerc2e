require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const connectDB = require("./database/database.js");
const routers = require("./routers/routers");
const http = require("http");
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const redis = require("redis");
const methodOverride = require('method-override')
const session = require("express-session");
// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(
  session({
    secret: "ecommerce-secret", // ใช้สำหรับเข้ารหัส session
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 10 }, // อายุ session 10 นาที
  })
);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
// สร้าง Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379", // ใช้ REDIS_URL จาก .env ถ้ามี
});
app.use("/api", routers(redisClient));
// ฟังก์ชันเชื่อมต่อทั้งหมด
const startServer = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await connectDB(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully");

    // เชื่อมต่อ Redis
    await redisClient.connect(); // ต้องเรียก connect() ใน redis@4.x
    console.log("Redis connected successfully");

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });

    // รันเซิร์ฟเวอร์
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }
};

// เรียกใช้งาน
startServer();

// Export สำหรับ Vercel
module.exports = server;