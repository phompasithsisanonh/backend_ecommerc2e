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
const PORT = process.env.PORT || 8080;
const methodOverride = require('method-override')

app.use(
  cors({
    origin: "*", // ใช้ * สำหรับทุกๆ Origin หรือเปลี่ยนเป็น URL ที่ต้องการอนุญาต
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))

app.use("/api", routers);

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

// Export สำหรับ Vercel
module.exports = server;