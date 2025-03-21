const formidable = require("formidable");
const AdminModel = require("../models/adminModel");
const sellerCustomerModel = require("../models/chat/sellerCustomerModel");
const sellerModel = require("../models/sellerModel");
const { response } = require("../utils/response");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
//registerAdmin
const authregisteradminController = async (req, res) => {
  try {
    const { name, email, password, image } = req.body;
    const findAdmin = await AdminModel.findOne({ email });
    if (findAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
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
    response(res, 500, error.message);
  }
};
//seller_reigster
const seller_reigster = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    const getUser = await sellerModel.findOne({ email });
    if (getUser) {
      res.status(404).json({
        message: "this have email in system",
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const rando = Math.floor();
      console.log("Hashed Password:", hashedPassword);
      const ran = Math.floor(100000 + Math.random() * 900000);
      const seller = await sellerModel.create({
        name,
        email,
        password: hashedPassword,
        method: "menualy",
        shopInfo: {},
        seller_code: ran,
      });
      await sellerCustomerModel.create({
        myId: seller?._id,
      });
      const token = JWT.sign(
        { _id: seller._id, role: seller.role },
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
      await seller.save();
      res.status(200).json({
        message: "register Seller successFully",
      });
    }
  } catch (err) {
    console.log(err);
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

    console.log("Received email:", email);
    console.log("Received password:", password);

    const findSeller = await sellerModel.findOne({ email }).select("+password");
    console.log(findSeller);
    if (!findSeller) {
      return res.status(404).json({
        success: false,
        message: "Email or password incorrect",
      });
    }

    console.log("Stored hash password:", findSeller.password);

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
          if (result) {
            await sellerModel.findByIdAndUpdate(id, {
              image: result.url,
            });
            // const oldPublicId = oldImage[0].split("/").pop().split(".")[0];
            // await cloudinary.uploader.destroy(`profile/${oldPublicId}`);
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
    console.log(sellerId, statusverified, rejectionReason)
    const findSeller = await sellerModel.findByIdAndUpdate(sellerId, {
      "kyc.status": statusverified,
      "kyc.rejectionReason": rejectionReason,
    });
    // Missing response to client
    res.status(200).json({ success: true, seller: findSeller });
  } catch (err) {
    console.log(err);
    // Missing error response to client
    res.status(500).json({ success: false, message: "Server error" });
  }
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
