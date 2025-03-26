const nodemailer = require("nodemailer");
const seller = require("../models/sellerModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// ขั้นตอนที่ 1: ผู้ขายส่งอีเมล เราตรวจสอบว่ามีอยู่ในฐานข้อมูลหรือไม่
const send_email = async (req, res) => {
  const { email } = req.body;

  // ขั้นตอนที่ 2: ตรวจสอบว่าอีเมลมีอยู่ในฐานข้อมูลหรือไม่
  const user = await seller.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "ไม่พบผู้ใช้" });
  }

  // สร้างโทเค็นที่มีรหัสผู้ใช้
  const token = jwt.sign({ id: user._id },process.env.TOKEN_SECRET, {
    expiresIn: "1h",
  });

  // ขั้นตอนที่ 3: ส่งอีเมลรีเซ็ตรหัสผ่าน
  await sendResetPasswordEmail(email, token);

  res.json({ message: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว" });
};

// ฟังก์ชันนี้ส่งอีเมลพร้อมลิงก์รีเซ็ต
const sendResetPasswordEmail = async (to, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // สร้างลิงก์รีเซ็ตที่ผู้ขายจะคลิก
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: "คำขอรีเซ็ตรหัสผ่าน",
      html: `
        <h2>คำขอรีเซ็ตรหัสผ่าน</h2>
        <p>คลิกปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ:</p>
        <a href="${resetLink}" 
           style="background-color: #4CAF50; color: white; padding: 10px 15px; 
                  text-align: center; text-decoration: none; display: inline-block; 
                  border-radius: 5px; margin: 10px 0;">
           รีเซ็ตรหัสผ่าน
        </a>
        <p>หรือคัดลอกและวางลิงก์นี้ในเบราว์เซอร์ของคุณ:</p>
        <p>${resetLink}</p>
        <p>หากคุณไม่ได้ร้องขอนี้ โปรดเพิกเฉยต่ออีเมลนี้</p>
        <p>ลิงก์นี้จะหมดอายุในหนึ่งชั่วโมง</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("ส่งอีเมลรีเซ็ตรหัสผ่านไปยัง:", to);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ต:", error);
  }
};

// ขั้นตอนที่ 4: เมื่อผู้ขายคลิกลิงก์ พวกเขาจะไปที่แบบฟอร์มเพื่อป้อนรหัสผ่านใหม่
// ขั้นตอนที่ 5: เมื่อพวกเขาส่งแบบฟอร์ม ฟังก์ชันนี้จะประมวลผล
const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  // ตรวจสอบรหัสผ่าน
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
    });
  }

  // ตรวจสอบว่ารหัสผ่านตรงกัน
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "รหัสผ่านไม่ตรงกัน",
    });
  }

  try {
    // ตรวจสอบว่าโทเค็นถูกต้อง
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await seller.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "โทเค็นไม่ถูกต้อง" });
    }

    // แฮชรหัสผ่านใหม่และบันทึก
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: "โทเค็นไม่ถูกต้องหรือหมดอายุ" });
  }
};
module.exports.send_email = send_email;
module.exports.sendResetPasswordEmail = sendResetPasswordEmail;
module.exports.resetPassword = resetPassword;
