const formidable = require("formidable");
const AdminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const { response } = require("../utils/response");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");
const seller = require("../models/sellerModel");
const crypto = require("crypto");
require("dotenv").config();
//registerAdmin
const authregisteradminController = async (req, res) => {
  try {
    const { name, email, password, image } = req.body;
    const findAdmin = await AdminModel.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    if (findAdmin) {
      return res.status(404).json({ message: "Admin already exists" });
    } else {
      const newAdmin = new AdminModel({
        name,
        email,
        password: hashPassword,
      });
      await newAdmin.save();
      response(res, 200, newAdmin);
    }
  } catch (error) {
    response(res, 500, error.message);
  }
};
//authControllerLoginAdmin
const authController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findAdmin = await AdminModel.findOne({ email }).select("+password");
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "Please provide email and password",
      });
    }
    if (findAdmin) {
      const match = await bcrypt.compare(password, findAdmin.password);
      if (!match) {
        return res.status(404).json({
          success: false,
          message: "Invalid Password",
        });
      } else {
        const token = JWT.sign(
          { _id: findAdmin._id, role: findAdmin.role },
          process.env.TOKEN_SECRET,
          {
            expiresIn: "1d",
          }
        );
        if (token) {
          res.cookie("accessToken", token, {
            httpOnly: true,
            securre: false, //ture HTTPS  //false test HTTP
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000,
          });
        }
        res.status(200).json({
          success: true,
          message: "login successfully",
          token,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error });
  }
};
//seller_reigster
// ฟังก์ชันนี้ส่งอีเมลพร้อมลิงก์รีเซ็ต
let otpStore = {}; // เก็บ OTP ชั่วคราว

// **สร้างฟังก์ชัน Generate OTP**
const generateOTP = () => crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 ตัวอักษร
// **ตั้งค่า Nodemailer**
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const send_otp = async (req, res) => {
  const { email } = req.body;

  const existingSeller = await seller.findOne({ email });
  if (existingSeller) {
    return res
      .status(400)
      .json({ success: false, message: "Email is already registered" });
  }

  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // OTP หมดอายุใน 5 นาที

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Verify your email",
      text: `Your OTP Code is: ${otp}\nThis code will expire in 5 minutes.`,
    });
    res.json({
      success: true,
      message: "OTP sent to email. Verify to complete registration.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error sending email" });
  }
};
const seller_reigster = async (req, res) => {
  const { email, name, password, otp } = req.body;
  if (
    !otpStore[email] ||
    otpStore[email].otp !== otp ||
    Date.now() > otpStore[email].expires
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const seller_code = Math.floor(100000 + Math.random() * 900000); // Seller Code 6 หลัก

    const newSeller = new seller({
      name,
      email,
      password: hashedPassword,
      isVerified: true,
      seller_code,
    });

    await newSeller.save();
    delete otpStore[email]; // ลบ OTP หลังจากสมัครเสร็จ
    const token = JWT.sign(
      { _id: newSeller._id, role: "seller" },
      process.env.TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // HTTPS: true, HTTP: false
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res
      .status(201)
      .json({ success: true, message: "Seller registered successfully!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//seller-login
const seller_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบค่าที่ได้รับจาก req.body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }
    const findSeller = await sellerModel.findOne({ email }).select("+password");
    console.log(findSeller);
    if (!findSeller) {
      return res.status(404).json({
        success: false,
        message: "Email or password incorrect",
      });
    }
    if (!findSeller.password) {
      return res.status(500).json({
        success: false,
        message: "Stored password is missing",
      });
    }

    const match = await bcrypt.compare(password, findSeller.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = JWT.sign(
      { _id: findSeller._id, role: findSeller.role },
      process.env.TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false, // true for HTTPS
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
    });
  } catch (error) {
    console.error("Error in seller_login:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUser = async (req, res) => {
  try {
    const { id, role } = req;
    console.log(id, role);
    try {
      if (role === "admin") {
        const user = await AdminModel.findById(id);
        res.status(200).json({ userInfo: user });
      } else {
        const seller = await sellerModel.findById(id);
        res.status(200).json({
          userInfo: seller,
        });
      }
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
};
const profile_info_add = async (req, res) => {
  const {
    division,
    district,
    shopName,
    sub_district,
    phone,
    address,
    name,
  } = req.body;
  const { id } = req;

  try {
    await sellerModel.findByIdAndUpdate(id, {
      phone: phone,
      address: address,
      name: name,
      shopInfo: {
        shopName,
        division,
        district,
        sub_district,
      },
    });
    const userInfo = await sellerModel.findById(id);
    res.status(200).json({
      message: "Profile info Add Successfully",
      userInfo,
    });
  } catch (error) {
    console.log(error);
  }
};
const profile_image_upload = async (req, res) => {
  try {
    const { id } = req;
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ message: "Form parsing error" });
      }
      const { image } = files;
      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });
      try {
        for (let index = 0; index < image.length; index++) {
          const result = await cloudinary.uploader.upload(
            image[index].filepath,
            {
              folder: "profile",
            }
          );
          image[index] = result.url;
          const user = await sellerModel.findById(id);
          if (user.image) {
            const oldPublicId = user.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`profile/${oldPublicId}`);
          }

          if (result) {
            await sellerModel.findByIdAndUpdate(id, {
              image: result.url,
            });

            const userInfo = await sellerModel.findById(id);
            res
              .status(200)
              .json({ message: "Profile Image Upload Successfully", userInfo });
          } else {
            res.status(404).json({ message: "Image Upload Failed" });
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
const get_seller_profile = async (req, res) => {
  const { id } = req;
  try {
    const find_profile = await sellerModel.findById(id);

    res.status(200).json({
      data: find_profile,
    });
  } catch (err) {
    console.log(err);
  }
}; // Helper function to upload image to cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // Debug to see what's in the file object
    console.log("File object:", JSON.stringify(file));

    // Check if file is valid
    if (!file || !file.filepath) {
      throw new Error("Invalid file object");
    }

    cloudinary.config({
      cloud_name: process.env.CLOUND_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
      secure: true,
    });

    // The issue might be with how formidable structures the file object
    // Different versions of formidable might use different property names
    const filePath = file.filepath || file.path; // Try both possible property names

    if (!filePath) {
      throw new Error("No file path found");
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "seller-kyc",
    });

    return result.secure_url;
  } catch (error) {
    console.error("Error uploading to cloudinary:", error);
    throw new Error("Failed to upload image");
  }
};

const uploadKycDocument = async (req, res) => {
  const { id } = req;
  // Set the options to keep the file extensions and file paths
  const form = new formidable.IncomingForm({
    keepExtensions: true,
    multiples: true,
  });

  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ error: "Error parsing form data" });
      }

      console.log("Files received:", JSON.stringify(files));

      // Check if files object exists and has the required properties
      if (
        !files ||
        !files.idCard ||
        !files.businessLicense ||
        !files.addressProof
      ) {
        return res.status(400).json({ error: "Missing required documents" });
      }

      try {
        // Upload all files to Cloudinary and store the URLs
        const idCardUrl = await uploadToCloudinary(
          files.idCard[0] || files.idCard
        );
        const businessLicenseUrl = await uploadToCloudinary(
          files.businessLicense[0] || files.businessLicense
        );
        const addressProofUrl = await uploadToCloudinary(
          files.addressProof[0] || files.addressProof
        );

        // Create object with document URLs
        const kycDocuments = {
          idCard: idCardUrl,
          businessLicense: businessLicenseUrl,
          addressProof: addressProofUrl,
        };

        // Update seller's KYC documents in database
        const seller = await sellerModel.findById(id);
        if (!seller) {
          return res.status(404).json({ error: "Seller not found" });
        }

        // Update seller's KYC information
        seller.kyc = {
          ...seller.kyc,
          ...kycDocuments,
          status: "under_review",
          submittedAt: new Date(),
        };

        await seller.save();

        return res.status(200).json({
          message: "KYC documents uploaded successfully",
          documents: kycDocuments,
        });
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(500).json({ error: "Error uploading documents" });
      }
    });
  } catch (error) {
    console.error("Error uploading KYC document:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const verify_admin = async (req, res) => {
  try {
    const { sellerId, statusverified, rejectionReason } = req.body;

    // Find seller
    const findSeller = await sellerModel.findById(sellerId);
    if (!findSeller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    // Delete KYC images from Cloudinary
    if (findSeller.kyc) {
      const imagesToDelete = [
        findSeller.kyc.idCard,
        findSeller.kyc.businessLicense,
        findSeller.kyc.addressProof,
      ];
      cloudinary.config({
        cloud_name: process.env.CLOUND_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
        secure: true,
      });
      for (const imageUrl of imagesToDelete) {
        if (imageUrl) {
          const publicId = imageUrl.split("/").pop().split(".")[0]; // Extract public ID
          await cloudinary.uploader.destroy(`seller-kyc/${publicId}`);
        }
      }
    }

    // Remove KYC images from database
    findSeller.kyc.idCard = "";
    findSeller.kyc.businessLicense = "";
    findSeller.kyc.addressProof = "";
    findSeller.kyc.status = statusverified;
    findSeller.kyc.rejectionReason = rejectionReason;

    await findSeller.save();

    res.status(200).json({ success: true, seller: findSeller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//show login last login
const updateLastLogin = async (req, res) => {
  const { id } = req;
  const data = await AdminModel.findByIdAndUpdate(id, {
    lastLogin: new Date().toISOString(),
  });
  res.status(200).json({ success: true, data });
};
module.exports.authregisteradminController = authregisteradminController;
module.exports.authController = authController;
module.exports.seller_reigster = seller_reigster;
module.exports.seller_login = seller_login;
module.exports.getUser = getUser;
module.exports.profile_info_add = profile_info_add;
module.exports.profile_image_upload = profile_image_upload;
module.exports.get_seller_profile = get_seller_profile;
module.exports.uploadKycDocument = uploadKycDocument;
module.exports.verify_admin = verify_admin;
module.exports.send_otp = send_otp;
module.exports.updateLastLogin = updateLastLogin;
