require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const connectDB = require("./database/database.js");
const router = require("./routers/routers");
const http = require("http");
const mongoose = require("mongoose");
const server = http.createServer(app);
const methodOverride = require("method-override");
// ใช้ PORT จาก environment variable ของ Railway
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: ["https://easyshoplaos.netlify.app","http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.use("/api", router);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});
const startServer = async () => {
  try {
    // เชื่อมต่อ MongoDB
    await connectDB(process.env.MONGODB_URL);
    console.log("MongoDB connected successfully");

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

// จัดการ SIGTERM
process.on("SIGTERM", () => {
  console.log("ได้รับสัญญาณ SIGTERM กำลังปิดเซิร์ฟเวอร์...");
  server.close(() => {
    console.log("เซิร์ฟเวอร์ปิดแล้ว");
    mongoose.connection.close(false, () => {
      console.log("การเชื่อมต่อ MongoDB ปิดแล้ว");
      process.exit(0);
    });
  });
});

// จัดการ SIGINT
process.on("SIGINT", () => {
  console.log("ได้รับสัญญาณ SIGINT กำลังปิดเซิร์ฟเวอร์...");
  server.close(() => {
    console.log("เซิร์ฟเวอร์ปิดแล้ว");
    mongoose.connection.close(false, () => {
      console.log("การเชื่อมต่อ MongoDB ปิดแล้ว");
      process.exit(0);
    });
  });
});

module.exports = server;